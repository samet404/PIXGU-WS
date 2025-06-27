import { authorizedPlayer } from './authorizedPlayer'
import { io } from '@/io'
import type { Socket } from 'socket.io'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'
import { emitIO } from 'utils/emitIO'
import { redisDb } from '@/db/redis'
import type { Guest } from 'types/guest'
import { onConnection } from 'helpers/onConnection'
import { onAuth } from 'helpers/onAuth'
import { getRoomID } from 'helpers/getRoomID'
import { RTCSecretKeyForPlayer } from '@/zod/schema/RTCSecretKeyForPlayer'
import { RTCSecretKeyForHost } from '@/zod/schema/RTCSecretKeyForHost'
import { guestSchema } from '@/zod/schema/guest'
import { userSchema } from '@/zod/schema/user'

export const playerIO = io.of(`/p`)

const playerLeftSchema = z.object({
  uniqueSocketID: z.string(),
  clientID: z.string().cuid2()
})

const playerJoinedSchema = z.object({
  uniqueSocketID: z.string(),
  clientInfo: z.union([userSchema, guestSchema])
})


const ready = async (s: Socket, roomID: string, clientID: string, clientInfo: Guest) => {
  await redisDb.incr(`user:${clientID}:unique_socket_id_count`)
  const uniqueSocketID = (await redisDb.get(`user:${clientID}:unique_socket_id_count`))!

  s.on('disconnect', async () => {
    emitIO()
      .output(playerLeftSchema)
      .emit(io.of('/h').to(roomID), 'player-left', {
        uniqueSocketID,
        clientID
      })
  })

  const secretKeyForWebRTC = createId()

  emitIO().output(RTCSecretKeyForHost).emit(io.of('/h').to(s.data.roomID), 'secret-key', {
    userID: clientID,
    secretKey: secretKeyForWebRTC
  })

  emitIO().output(RTCSecretKeyForPlayer).emit(s, 'secret-key', {
    secretKey: secretKeyForWebRTC
  })

  emitIO()
    .output(playerJoinedSchema)
    .emit(io.of('/h').to(s.data.roomID), 'player-joined', { clientInfo, uniqueSocketID })
}

export const player = () => {
  onConnection(playerIO, (s) => {
    onAuth(s, {

      guest: {
        beforeRes: (s) => authorizedPlayer(s),
        afterRes: (s) => {
          const roomID = getRoomID(s)
          const guestID = s.data.guestID
          const guest = s.data.guest

          s.once('ready', () => ready(s, roomID, guestID, guest))
        },
      },
      logged: {
        beforeRes: (s) => authorizedPlayer(s),
        afterRes: (s) => {
          const roomID = getRoomID(s)
          const userID = s.data.userID
          const user = s.data.user

          s.once('ready', () => ready(s, roomID, userID, user))
        }
      },
    })
  })
}
