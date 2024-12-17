import { redisDb } from '@/redis'
import { io } from '@/io'
import { emitIO, logErr } from '@/utils'
import type {
  AllSocketData,
  AtLeastOne,
  HostSocket,
  IsJoinedSocketData,
  JoinedSocket,
} from '@/types'
import { getRoomID, killRoom } from '@/helpers'
import { z } from 'zod'
import type { Socket } from 'socket.io'
import { VERSION } from '@/src/constants'


const hostAuthSchema = z.union([
  z.object({
    isSuccess: z.literal(false),
    reason: z.string(),
  }),
  z.object({
    isSuccess: z.literal(true),
  }),
])


export const onHostAuth = async <T extends AllSocketData>(
  s: IsJoinedSocketData<T> extends never ? never : JoinedSocket,
  cbs?: AtLeastOne<{
    beforeRes: (s: HostSocket<T>) => void
    afterRes: (s: HostSocket<T>) => void
  }>,
) =>
  s.once('host-auth', async () => {
    let isDisconnected = false
    const roomID = getRoomID(s)
    const roomVersion = await redisDb.get(`room:${roomID}:version`)

    if (roomVersion !== VERSION) {
      emitIO().output(hostAuthSchema).emit(s, 'host-auth', {
        isSuccess: false,
        reason: 'UNAUTHORIZED: INCOMPATIBLE_VERSION',
      })
      s.disconnect()
      killRoom(roomID, 'UPDATE_REQUIRED')
      return
    }

    const hasPass = await redisDb.get(`room:${roomID}:password`)

    const isRoomActiveInRedis = await redisDb.sismember('active_rooms', roomID)
    if (isRoomActiveInRedis === 0) {
      logErr(`Room ${roomID} is not active`, new Error())
      emitIO().output(hostAuthSchema).emit(s, 'host-auth', {
        isSuccess: false,
        reason: 'UNAUTHORIZED: ROOM_NOT_ACTIVE',
      })
      s.disconnect()
      return
    }

    const userID = s.data.isLogged ? s.data.userID : s.data.guestID
    const hostID = await redisDb.get(`room:${roomID}:host_ID`)

    console.log(JSON.stringify({ userID, hostID }, null, 2))
    if (userID !== hostID) {
      logErr(`User ${userID} is not the host of room ${roomID}`, new Error())
      emitIO().output(hostAuthSchema).emit(s, 'host-auth', {
        isSuccess: false,
        reason: 'UNAUTHORIZED: USER_NOT_HOST',
      })
      s.disconnect()
      if (isDisconnected) return
      return
    }

    await redisDb.set(`room:${roomID}:host_in_room`, '0')

    const isInRoom = await redisDb.get(`room:${roomID}:host_in_room`)
    console.log('isInRoom ', isInRoom)
    if (isInRoom === '1') {
      emitIO().output(hostAuthSchema).emit(s, 'host-auth', {
        isSuccess: false,
        reason: 'UNAUTHORIZED: ALREADY_IN_ROOM',
      })
      s.disconnect()
      return
    }

    await redisDb.incr(`room:${roomID}:total_connections`)
    s.emit('host-joined', s.data.isLogged ? s.data.user : s.data.guest)

    s.on('disconnect', async () => {
      if (!hasPass) await redisDb.srem('active_public_rooms', roomID)
      io.of('/p').to(roomID).emit('host-left')
      io.of('/p').to(roomID).disconnectSockets()
      await redisDb.set(`room:${roomID}:host_in_room`, '0')
      await redisDb.set(`room:${roomID}:total_players`, '0')
      await redisDb.set(`room:${roomID}:total_connections`, '0')
    })

    s.data.roomID = roomID
    s.join(roomID)
    await redisDb.set(`room:${roomID}:host_in_room`, '1')
    await redisDb.set(`room:${roomID}:game_started`, '0')
    if (!hasPass) await redisDb.sadd('active_public_rooms', roomID)

    cbs?.beforeRes?.(s as unknown as HostSocket<T>)
    emitIO().output(hostAuthSchema).emit(s, 'host-auth', {
      isSuccess: true,
    })
    cbs?.afterRes?.(s as unknown as HostSocket<T>)
  })

