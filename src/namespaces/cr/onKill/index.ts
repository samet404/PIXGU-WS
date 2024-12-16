import { RoomID } from '@/zod/schema'
import { onIO } from '@/src/utils'
import { killRoom } from '@/src/helpers'
import { redisDb } from '@/src/db/redis'
import type { GuestSocketData, LoggedSocketData, OverrideProps } from '@/types'
import type { Socket } from 'socket.io'


type ContainsOneOfThese = LoggedSocketData | GuestSocketData
type RequiredSocket = OverrideProps<Socket, {
    data: ContainsOneOfThese & {
        isPlayer: boolean
        roomID: string
    }
}>

export const onKill = (s: RequiredSocket) => onIO().input(RoomID).on(s, 'kill',
    async (roomID) => {
        const userID = s.data.isLogged ? s.data.userID : s.data.guestID
        const hostID = await redisDb.get(`room:${roomID}:host_ID`)
        if (userID !== hostID) return

        await killRoom(roomID, 'HOST')
        s.emit('killed', undefined)
    }) 