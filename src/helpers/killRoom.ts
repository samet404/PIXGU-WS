import { emitIO } from '../utils'
import { io } from '../io'
import { REDIS_ROOM_KEYS_BY_ROOM_ID, REDIS_ROOM_KEYS_BY_USER_ID, REDIS_ROOM_OTHERS_KEYS } from '../constants'
import { redisDb } from '../db/redis'
import { z } from 'zod'

export const killRoom = async (
  roomID: string,
  reason: Reason,
) => {
  try {
    const players = io.of('/p').to(roomID)
    const host = io.of('/h').to(roomID)

    emitIO().output(z.object({
      reason: z.enum(['TIME_IS_UP', 'SERVER_RESTART', 'HOST', 'UPDATE_REQUIRED']),
    })).emit(players, 'room_killed', { reason: reason } as RoomKilled)
    emitIO().output(z.object({
      reason: z.enum(['TIME_IS_UP', 'SERVER_RESTART', 'HOST', 'UPDATE_REQUIRED']),
    })).emit(host, 'room_killed', { reason: reason } as RoomKilled)

    const redisRoomKeysByRoomID = REDIS_ROOM_KEYS_BY_ROOM_ID(roomID)
    const hostID = await redisDb.get(redisRoomKeysByRoomID.hostID)

    if (!hostID) return

    const redisRoomKeysByUserID = REDIS_ROOM_KEYS_BY_USER_ID(hostID)
    const redisRoomOthersKeys = REDIS_ROOM_OTHERS_KEYS

    for (const subKey of Object.values(redisRoomKeysByRoomID)) {
      await redisDb.del(subKey)
    }

    await redisDb.srem(redisRoomKeysByUserID.createdRooms, roomID)
    await redisDb.srem(redisRoomOthersKeys.activePublicRooms, roomID)
    await redisDb.srem(redisRoomOthersKeys.activeRooms, roomID)

    players.disconnectSockets()
    host.disconnectSockets()
  } catch (error) {

    console.error('Error in killRoom:', error)
  }
}

type RoomKilled = {
  reason: 'TIME_IS_UP' | 'SERVER_RESTART' | 'HOST' | 'UPDATE_REQUIRED'
}

type Reason = 'TIME_IS_UP' | 'SERVER_RESTART' | 'HOST' | 'UPDATE_REQUIRED'
