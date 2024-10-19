import { redisDb } from '@/redis'
import { io } from '@/io'
import { getRoomID } from '@/helpers'
import chalk from 'chalk'
import { emitIO } from '@/src/utils'
import { guestSchema, userSchema } from '@/zod/schema'
import type {
  GuestPlayerSocket,
  GuestSocket,
  LoggedPlayerSocket,
  LoggedSocket,
} from '@/types'
import { z } from 'zod'

export const isPlayer = async (
  s: LoggedSocket | GuestSocket,
  cb: (s: GuestPlayerSocket | LoggedPlayerSocket) => void,
) => {
  const errLog = (a: any) => console.log(chalk.redBright(a))
  const roomID = getRoomID(s)
  const clientID = s.data.isLogged ? s.data.userID : s.data.guestID
  const clientInfo = s.data.isLogged ? s.data.user : s.data.guest

  const isHostInRoom =
    (await redisDb.get(`room:${roomID}:host_in_room`)) === '1'

  if (!isHostInRoom) {
    errLog(`Room ${roomID} is not active`)
    emitIO.output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'HOST_NOT_IN_ROOM',
        message: 'Host is not in the room',
      },
    })
    s.disconnect()
    return
  }

  if (!roomID) {
    emitIO.output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'ROOM_NOT_FOUND',
        message: 'Room is not found',
      },
    })
    s.disconnect()
    return
  }

  const isRoomActiveInRedis =
    (await redisDb.sismember('active_rooms', roomID)) === 0
  if (isRoomActiveInRedis) {
    emitIO.output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'ROOM_NOT_ACTIVE',
        message: 'Room is not active',
      },
    })
    s.disconnect()
    return
  }

  const isInRoom =
    (await redisDb.sismember(`room:${roomID}:players`, clientID)) === 1
  if (isInRoom) {
    errLog(`User ${clientID} is already in room ${roomID}`)
    emitIO.output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'ALREADY_IN_ROOM',
        message: 'You are already in the room',
      },
    })
    s.disconnect()
    return
  }

  s.on('disconnect', async () => {
    await redisDb.srem(`room:${roomID}:players`, clientID)
    await redisDb.decr(`room:${roomID}:total_connections`)
    emitIO
      .output(z.union([userSchema, guestSchema]))
      .emit(io.of('/host').to(roomID), 'player-left', clientInfo)
  })

  await redisDb.incr(`room:${roomID}:total_connections`)
  await redisDb.sadd(`room:${roomID}:players`, clientID)
  s.join(roomID + clientID)
  emitIO
    .output(z.union([userSchema, guestSchema]))
    .emit(io.of('/host').to(roomID), 'player-joined', clientInfo)
  ;(s as LoggedPlayerSocket | GuestPlayerSocket).data.isPlayer = true
  ;(s as LoggedPlayerSocket | GuestPlayerSocket).data.roomID = roomID

  emitIO.output(playerAuthSchema).emit(s, 'player-auth', {
    isSuccess: true,
  })
  cb(s as LoggedPlayerSocket | GuestPlayerSocket)
}

const playerAuthSchema = z.union([
  z.object({
    isSuccess: z.literal(false),
    reason: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
  z.object({
    isSuccess: z.literal(true),
  }),
])
