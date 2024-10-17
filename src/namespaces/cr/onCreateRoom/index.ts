import { z } from 'zod'
import { emitIO, logErr, onIO } from '@/utils'
import type { LoggedSocket, NotLoggedSocket } from '@/types'
import { redisDb } from '@/redis'
import { lookupCity } from '@/geoIP'
import { emitErr, createRoomID } from './funcs'

/**
 * Creates a room
 */
export const onCreateRoom = (s: LoggedSocket | NotLoggedSocket) =>
  onIO
    .input(
      z.object({
        name: z
          .string()
          .min(1)
          .max(20)
          .refine((v) => v.trim() !== '', {
            message: 'Name cannot be empty string',
          }),
        password: z
          .string()
          .min(1)
          .max(50)
          .refine((v) => v.trim() !== '', {
            message: 'Name cannot be empty string',
          })
          .nullish(),
      }),
    )
    .on(s, 'cr', async (input) => {
      const userID = (() => {
        if (s.data.isLogged) return s.data.userID
        return s.id
      })()

      const createdRoomsCount = await redisDb.scard(
        `user:${userID}:created_rooms`,
      )

      if (createdRoomsCount >= 4) {
        logErr('Maximum number of rooms reached', new Error())
        emitErr(s, 'REACHED_MAX_ROOMS')
        return
      }

      const createdAt = new Date()
      const { name, password } = input

      const roomID = await createRoomID()
      if (!roomID) {
        logErr('Server error while creating room ID', new Error())
        emitErr(s, 'INTERNAL_SERVER_ERROR')
        return
      }

      const geoIP = await lookupCity(s.handshake.address)

      if (!geoIP) {
        logErr('Geolocation information not found', new Error())
        emitErr(s, 'GEOLOCATION_INFORMATION_NOT_FOUND')
        return
      }

      const ll = [geoIP.location.latitude, geoIP.location.longitude]
      const country = geoIP.country.iso_code

      await redisDb.set(`room:${roomID}:name`, name)
      await redisDb.sadd(`room:${roomID}:admins`, userID)
      await redisDb.sadd(`room:${roomID}:players`, userID)
      await redisDb.sadd(`room:${roomID}:players`, userID)
      await redisDb.set(`room:${roomID}:created_at`, createdAt.toString())
      await redisDb.set(`room:${roomID}:host_ID`, userID)
      await redisDb.set(`room:${roomID}:host_in_room`, 0)
      await redisDb.set(`room:${roomID}:host_country`, country)
      await redisDb.set(`room:${roomID}:host_LL`, JSON.stringify(ll))
      await redisDb.sadd(`user:${userID}:created_rooms`, roomID!)
      await redisDb.set(`room:${roomID}:`, userID)

      if (password) {
        await redisDb.set(`room:${roomID!}:password`, password)
        await redisDb.sadd(`room:${roomID!}:players_known_pass`, userID)
      } else {
        await redisDb.sadd(`active_public_rooms`, roomID!)
      }

      emitIO.emit(s, 'cr-success', roomID)
    })
