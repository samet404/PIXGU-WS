import { redisDb } from '@/db/redis'
import { getCookies } from 'helpers/getCookies'
import type { Socket } from 'socket.io'
import { z } from 'zod'

export const killGuest = async (s: Socket) => {
  const cookies = getCookies(s)
  if (!cookies) return

  const authSession = cookies['guest_auth_session']
  if (authSession) {
    try {
      z.string().min(10).cuid2().parse(authSession)

      const guestID = await redisDb.get(`guest:session:${authSession}:ID`)
      await redisDb.del(`guest:session:${authSession}:ID`)
      await redisDb.del(`guest:${guestID}:name`)
      await redisDb.del(`guest:${guestID}:name_ID`)
      await redisDb.del(`guest:${guestID}:name_&_name_ID`)
    } catch (error) {
      console.error('Error deleting guest session from redis')
      console.error(error)
    }
  }
}
