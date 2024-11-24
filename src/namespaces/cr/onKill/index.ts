import { RoomID } from '@/zod/schema'
import type { GuestSocket, LoggedSocket } from '@/src/types'
import { onIO } from '@/src/utils'
import { killRoom } from '@/src/helpers'
import { redisDb } from '@/src/db/redis'

export const onKill = (s: GuestSocket | LoggedSocket) => onIO().input(RoomID).on(s, 'kill',
    async (roomID) => {
        const userID = s.data.isLogged ? s.data.userID : s.data.guestID
        const hostID = await redisDb.get(`room:${roomID}:host_ID`)
        if (userID !== hostID) return

        await killRoom(roomID, 'HOST')
        s.emit('killed', undefined)
    }) 