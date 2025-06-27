import { redisDb } from '@/db/redis'
import { RoomID } from '@/zod/schema/roomID'
import { killRoom } from 'helpers/killRoom'
import type { Socket } from 'socket.io'
import { onIO } from 'utils/onIO'

export const onKill = (s: Socket) => onIO().input(RoomID).on(s, 'kill',
    async (roomID) => {
        const userID = s.data.isLogged ? s.data.userID : s.data.guestID
        const hostID = await redisDb.get(`room:${roomID}:host_ID`)
        if (userID !== hostID) return

        await killRoom(roomID, 'HOST')
        s.emit('killed', undefined)
    }) 