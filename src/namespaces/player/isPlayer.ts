import { MAX_PLAYERS_PER_ROOM } from '@/constants'
import { getRoomID } from '@/helpers'
import { emitIO } from '@/src/utils'
import { redisDb } from '@/redis'
import { env } from '@/src/env'
import chalk from 'chalk'
import { z } from 'zod'
import type {
  GuestPlayerSocket,
  GuestSocket,
  LoggedPlayerSocket,
  LoggedSocket,
} from '@/types'

export const isPlayer = async (
  s: LoggedSocket | GuestSocket,
  cb: (s: GuestPlayerSocket | LoggedPlayerSocket) => void,
) => {
  const errLog = (a: any) => console.log(chalk.redBright(a))
  const roomID = getRoomID(s)
  const clientID = s.data.isLogged ? s.data.userID : s.data.guestID

  const isGameAlreadyStarted = (await redisDb.get(`room:${roomID}:game_started`)) === '1'
  if (isGameAlreadyStarted) {
    errLog(`Game already started ${roomID}`)
    emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'GAME_ALREADY_STARTED',
        message: 'Game already started',
      },
    })
    s.disconnect()
    return
  }

  const isRoomHavePass = await redisDb.exists(`room:${roomID}:password`)
  if (isRoomHavePass) {
    const isRoomPasswordCorrect = await redisDb.get(`room:${roomID}:password`) === s.handshake.auth.password
    if (!isRoomPasswordCorrect) {
      errLog(`Room password is incorrect ${roomID}`)
      emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
        isSuccess: false,
        reason: {
          code: 'INCORRECT_PASSWORD',
          message: 'Incorrect password',
        },
      })
      s.disconnect()
      return
    }
  }

  const isHostInRoom = env.NODE_ENV === 'development' ? true : (await redisDb.get(`room:${roomID}:host_in_room`)) === '1'

  const totalPlayers = env.NODE_ENV === 'development' ? 0 : await redisDb.incr(`room:${roomID}:total_players`)
  if (totalPlayers >= MAX_PLAYERS_PER_ROOM) {
    errLog(`Room full ${roomID}`)
    emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'ROOM_FULL',
        message: 'Room is full',
      },
    })
    s.disconnect()
    return
  }

  const blocked = (await redisDb.sismember(`room:${roomID}:blocked_users`, clientID)) === 1
  if (blocked) {
    errLog(`User ${clientID} is blocked in room ${roomID}`)
    emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'USER_BLOCKED',
        message: 'You are blocked in the room',
      },
    })
    s.disconnect()
    return
  }

  if (!isHostInRoom) {
    errLog(`Host not in room ${roomID}`)
    emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
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
    emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
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
    emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'ROOM_NOT_ACTIVE',
        message: 'Room is not active',
      },
    })
    s.disconnect()
    return
  }

  const isInRoom = env.NODE_ENV === 'development' ? false : (await redisDb.sismember(`room:${roomID}:players`, clientID)) === 1
  if (isInRoom) {
    errLog(`User ${clientID} is already in room ${roomID}`)
    emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
      isSuccess: false,
      reason: {
        code: 'ALREADY_IN_ROOM',
        message: 'You are already in the room',
      },
    })
    s.disconnect()
    return
  }


  s.join(roomID + clientID)
  s.join(roomID)
    ; (s as LoggedPlayerSocket | GuestPlayerSocket).data.isPlayer = true
    ; (s as LoggedPlayerSocket | GuestPlayerSocket).data.roomID = roomID

  emitIO().output(playerAuthSchema).emit(s, 'player-auth', {
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
