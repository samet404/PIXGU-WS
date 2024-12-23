import { z } from 'zod'
import { emitIO, logErr, onIO } from '@/utils'
import { redisDb } from '@/redis'
import { lookupCity } from '@/geoIP'
import { emitErr, createRoomID } from './funcs'
import { env } from '@/env'
import { io } from '@/io'
import { REDIS_ROOM_KEYS_BY_ROOM_ID, REDIS_ROOM_KEYS_BY_USER_ID, REDIS_ROOM_OTHERS_KEYS, VERSION } from '@/constants'
import type { GuestSocketData, LoggedSocketData, OverrideProps } from '@/types'
import type { Socket } from 'socket.io'
import { crIO } from '..'

type ContainsOneOfThese = LoggedSocketData | GuestSocketData
type RequiredSocket = OverrideProps<Socket, {
  data: ContainsOneOfThese & {
    isPlayer: boolean
    roomID: string
  }
}>

/**
 * Creates a room
 */
export const onCreateRoom = (s: RequiredSocket) =>
  onIO()
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
        console.log('creating room...')
        const lastVersion = await redisDb.get('last_version')

        if (lastVersion !== VERSION) {
          console.log(`last version (${lastVersion}) is not equal to current version (${VERSION})`)
          crIO.disconnectSockets()
          return
        }

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

        // @ts-ignore
        const geoIP = await lookupCity(s.data.IP as string | undefined ?? env.DEV_IP_ADDRESS)


        if (!geoIP) {
          logErr('Geolocation information not found', new Error())
          emitErr(s, 'GEOLOCATION_INFORMATION_NOT_FOUND')
          return
        }

        const ll = [geoIP.location.latitude, geoIP.location.longitude]
        const country = geoIP.country.iso_code

        const redisKeysByRoomID = REDIS_ROOM_KEYS_BY_ROOM_ID(roomID)
        const redisKeysByUserID = REDIS_ROOM_KEYS_BY_USER_ID(userID)
        const redisKeysOther = REDIS_ROOM_OTHERS_KEYS

        await redisDb.set(redisKeysByRoomID.totalPlayers, 0)
        await redisDb.sadd(redisKeysOther.activeRooms, roomID!)
        await redisDb.set(redisKeysByRoomID.name, name)
        await redisDb.sadd(redisKeysByRoomID.admins, userID)
        await redisDb.set(redisKeysByRoomID.createdAt, createdAt.toISOString())
        await redisDb.set(redisKeysByRoomID.hostID, userID)
        await redisDb.set(redisKeysByRoomID.hostInRoom, 0)
        await redisDb.set(redisKeysByRoomID.hostCountry, country)
        await redisDb.set(redisKeysByRoomID.hostLL, JSON.stringify(ll))
        await redisDb.sadd(redisKeysByUserID.createdRooms, roomID!)
        await redisDb.set(redisKeysByRoomID.version, VERSION)

        if (password) {
          await redisDb.set(redisKeysByRoomID.password, password)
          await redisDb.sadd(redisKeysByRoomID.playersKnownPass, userID)
        }

        emitIO()
          .output(z.any())
          .emit(io.of('/cr').to(userID), 'cr-success', roomID)
      } catch (error) {
        emitErr(s, 'INTERNAL_SERVER_ERROR')
        console.error(error)
      }
    })
