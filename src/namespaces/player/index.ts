import type { Guest, GuestSocketData, LoggedSocketData, OverrideProps } from '@/types'
import { getRoomID, onAuth, onConnection } from '@/helpers'
import { authorizedPlayer } from './authorizedPlayer'
import { guestSchema, RTCSecretKeyForHost, RTCSecretKeyForPlayer, userSchema } from '@/zod/schema'
import { io } from '@/io'
import { emitIO } from '@/src/utils'
import { z } from 'zod'
import { redisDb } from '@/src/db/redis'
import type { User } from 'lucia'
import type { Socket } from 'socket.io'
import { createId } from '@paralleldrive/cuid2'

export const playerIO = io.of(`/p`)

type ContainsOneOfThese = LoggedSocketData | GuestSocketData
type ReadySocket = OverrideProps<Socket, {
  data: ContainsOneOfThese & {
    isPlayer: boolean
    roomID: string
  }
}>

export const PlayerInfoSchema = z.union([userSchema, guestSchema])

const ready = (s: ReadySocket, roomID: string, clientID: string, clientInfo: Guest | User) => {
  console.log('clientID: ', clientID)
  s.on('disconnect', async () => {
    const isConnectedToHost = await redisDb.sismember(`room:${roomID}:players`, clientID)
    if (isConnectedToHost) {
      console.log('disconnecting player')
      await redisDb.srem(`room:${roomID}:players`, clientID)
      await redisDb.decr(`room:${roomID}:total_connections`)
      await redisDb.decr(`room:${roomID}:total_players`)
    }

    emitIO()
      .output(PlayerInfoSchema)
      .emit(io.of('/h').to(roomID), 'player-left', clientInfo)
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
    .output(PlayerInfoSchema)
    .emit(io.of('/h').to(s.data.roomID), 'player-joined', clientInfo)

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
