import { redisDb } from '@/redis'
import { io } from '@/io'
import { emitIO, logErr } from '@/utils'
import type {
  AtLeastOne,
  GuestSocket,
  LoggedSocket,
  OverrideProps,
  SocketAll,
} from '@/types'
import { getRoomID } from '@/helpers'
import { z } from 'zod'

type HostSocket = OverrideProps<
  LoggedSocket,
  {
    data: {
      isHost: true
      roomID: string
    } & LoggedSocket['data']
  }
>

export const onHostAuth = async <T extends SocketAll>(
  s: T,
  cbs?: AtLeastOne<{
    beforeRes: (s: ResultS<T>) => void
    afterRes: (s: ResultS<T>) => void
  }>,
) =>
  s.once('host-auth', async () => {
    let isDisconnected = false
    const roomID = getRoomID(s)

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
      await redisDb.set(`room:${roomID}:host_in_room`, '0')
      await redisDb.decr(`room:${roomID}:total_connections`)
      io.of('/p').to(roomID).emit('host-left')
    })
      ; (s as HostSocket).data.roomID = roomID
    console.log('roomID: ', roomID)
    s.join(roomID)
    await redisDb.set(`room:${roomID}:host_in_room`, '1')
    cbs?.beforeRes?.(s as ResultS<T>)
    emitIO().output(hostAuthSchema).emit(s, 'host-auth', {
      isSuccess: true,
    })
    cbs?.afterRes?.(s as ResultS<T>)
  })

const hostAuthSchema = z.union([
  z.object({
    isSuccess: z.literal(false),
    reason: z.string(),
  }),
  z.object({
    isSuccess: z.literal(true),
  }),
])

type ResultS<T extends SocketAll> = OverrideProps<
  T,
  {
    data: {
      isHost: true
      roomID: string
    }
  }
> &
  T
