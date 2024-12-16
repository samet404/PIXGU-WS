import type { Guest, GuestSocketData, LoggedSocketData, OverrideProps } from '@/types'
import { onAuth, onConnection } from '@/helpers'
import { authorizedPlayer } from './authorizedPlayer'
import { guestSchema, userSchema } from '@/zod/schema'
import { io } from '@/io'
import { emitIO } from '@/src/utils'
import { z } from 'zod'
import { redisDb } from '@/src/db/redis'
import type { User } from 'lucia'
import type { Socket } from 'socket.io'

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

  emitIO()
    .output(PlayerInfoSchema)
    .emit(io.of('/h').to(s.data.roomID), 'player-joined', clientInfo)
}

export const player = () => {
  onConnection(playerIO, (s) => {
    onAuth(s, {

      guest: {
        beforeRes: (s) => authorizedPlayer(s),
        afterRes: (s) =>
          s.once('ready', ready),
      },
      logged: {
        beforeRes: (s) => authorizedPlayer(s),
        afterRes: (s) =>
          s.once('ready', ready),
      },
    })
  })
}
