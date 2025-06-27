import { getCookies } from 'helpers/getCookies'
import { killGuest } from './kill'
import { z } from 'zod'
import type { Socket } from 'socket.io'
import { redisDb } from '@/db/redis'

export const validateGuest = async (s: Socket) => {
  console.log('validateGuest')
  try {
    const cookies = getCookies(s)
    if (!cookies) return

    const authSession = cookies['guest_auth_session']
    console.log('authSession: ', authSession)
    z.string().min(10).cuid2().parse(authSession)

    if (!authSession) return null

    const ID = await redisDb.get(`guest:session:${authSession}:ID`)
    if (!ID) {
      killGuest(s)
      return null
    }

    const name = await redisDb.get(`guest:${ID}:name`)
    if (!name) return null

    const nameID = await redisDb.get(`guest:${ID}:name_ID`)
    if (!nameID) return null

    const nameWithNameID = await redisDb.get(`guest:${ID}:name_&_name_ID`)
    if (!nameWithNameID) return null

    const guest = {
      ID,
      name,
      nameID,
      nameWithNameID,
    }

    return guest
  } catch (error) { }
}
