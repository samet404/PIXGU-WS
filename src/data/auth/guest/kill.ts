import { redisDb } from '@/db/redis'
import { getCookies } from '@/helpers'
import { REDIS_ROOM_KEYS_BY_ROOM_ID, REDIS_ROOM_KEYS_BY_USER_ID, REDIS_ROOM_OTHERS_KEYS } from '@/src/constants'
import type { SocketAll } from '@/types'
import { z } from 'zod'

export const killGuest = async (s: SocketAll) => {
  const cookies = getCookies(s)
  if (!cookies) return

  const authSession = cookies['guest_auth_session']
  if (authSession) {
    try {
      z.string().min(10).cuid2().parse(authSession)

      const guestID = await redisDb.get(`guest:session:${authSession}:ID`)
      const userID = await redisDb.get(`guest:${guestID}:ID`)
      if (!userID) return
      await redisDb.del(`guest:session:${authSession}:ID`)
      await redisDb.del(`guest:${guestID}:name`)
      await redisDb.del(`guest:${guestID}:name_ID`)
      await redisDb.del(`guest:${guestID}:name_&_name_ID`)
      await redisDb.del(`user:${userID}:settings:developer_mode`)
      const redisKeysByUserID = REDIS_ROOM_KEYS_BY_USER_ID(userID)

      const createdRooms = await redisDb.smembers(redisKeysByUserID.createdRooms)

      const redisKeysOther = REDIS_ROOM_OTHERS_KEYS

      for (const roomID of createdRooms) {
        const redisKeysByRoomID = REDIS_ROOM_KEYS_BY_ROOM_ID(roomID)

        for (const key of Object.keys(redisKeysByRoomID)) {
          await redisDb.del(key)
        }

        await redisDb.srem(redisKeysOther.activePublicRooms, roomID)
        await redisDb.srem(redisKeysOther.activeRooms, roomID)
      }


    } catch (error) {
      console.error('Error deleting guest session from redis')
      console.error(error)
    }
  }
}
