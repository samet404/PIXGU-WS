import { z } from 'zod'
import { emitIO, hToMS, logErr, onIO, setRealTimeout } from '@/utils'
import { redisDb } from '@/redis'
import { lookupCity } from '@/geoIP'
import { emitErr, createRoomID } from './funcs'
import { env } from '@/env'
import { hToS } from '@/utils'
import { io } from '@/io'
import type { GuestSocket, LoggedSocket } from '@/types'

/**
 * Creates a room
 */
export const onCreateRoom = (s: GuestSocket | LoggedSocket) =>
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
      try {
        const userID = (() => {
          if (s.data.isLogged) return s.data.userID
          return s.data.guestID
        })()
        console.log('userID: ', userID)
        console.log(s.data)

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

        const geoIP = await lookupCity(
          env.NODE_ENV === 'development'
            ? env.DEV_IP_ADDRESS
            : s.handshake.address,
        )

        if (!geoIP) {
          logErr('Geolocation information not found', new Error())
          emitErr(s, 'GEOLOCATION_INFORMATION_NOT_FOUND')
          return
        }

        const ll = [geoIP.location.latitude, geoIP.location.longitude]
        const country = geoIP.country.iso_code

        const room = `room:${roomID}`
        const redisKeys = {
          name: `${room}:name`,
          admins: `${room}:admins`,
          players: `${room}:players`,
          createdAt: `${room}:created_at`,
          hostID: `${room}:host_ID`,
          hostInRoom: `${room}:host_in_room`,
          hostCountry: `${room}:host_country`,
          hostLL: `${room}:host_LL`,
          password: `${room}:password`,
          playersKnownPass: `${room}:players_known_pass`,
          createdRooms: `user:${userID}:created_rooms`,
          activePublicRooms: `active_public_rooms`,
        }

        console.log(redisKeys)
        await redisDb.set(redisKeys.name, name)
        await redisDb.sadd(redisKeys.admins, userID)
        await redisDb.set(redisKeys.createdAt, createdAt.toISOString())
        await redisDb.set(redisKeys.hostID, userID)
        await redisDb.set(redisKeys.hostInRoom, 0)
        await redisDb.set(redisKeys.hostCountry, country)
        await redisDb.set(redisKeys.hostLL, JSON.stringify(ll))
        await redisDb.sadd(redisKeys.createdRooms, roomID!)

        if (password) {
          await redisDb.set(redisKeys.password, password)
          await redisDb.sadd(redisKeys.playersKnownPass, userID)
        } else {
          await redisDb.sadd(redisKeys.activePublicRooms, roomID!)
        }

        Object.keys(redisKeys).forEach((key) => {
          redisDb.expire(key, hToS(24))
        })

        setRealTimeout(
          async () =>
            emitIO
              .output(z.any())
              .emit(io.of('/player').to(roomID), 'room-killed', {
                reason: 'TIME_IS_UP',
              }),
          hToMS(24),
        )

        emitIO
          .output(z.any())
          .emit(io.of('/cr').to(userID), 'cr-success', roomID)
      } catch (error) {
        emitErr(s, 'INTERNAL_SERVER_ERROR')
        console.error(error)
      }
    })
