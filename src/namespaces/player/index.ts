import { io } from '@/io'
import { onAuth, onConnection } from '@/helpers'
import { authorizedPlayer } from './authorizedPlayer'
import { emitIO, onIO } from '@/src/utils'
import { z } from 'zod'
import { guestSchema, userSchema } from '@/zod/schema'
import { redisDb } from '@/src/db/redis'

export const playerIO = io.of(`/p`)

export const player = () => {
  onConnection(playerIO, (s) => {
    onAuth(s, {
      guest: {
        beforeRes: (s) => authorizedPlayer(s),
        afterRes: (s) =>
          s.once('ready', () => {
            // @ts-expect-error
            const roomID = s.data.roomID
            const clientID = s.data.guestID
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
                .output(z.union([userSchema, guestSchema]))
                .emit(io.of('/h').to(roomID), 'player-left', clientInfo)
            })

            console.log('player is ready')
            // @ts-expect-error
            const clientInfo = s.data.isLogged ? s.data.user : s.data.guest

            emitIO()
              .output(z.union([userSchema, guestSchema]))
              // @ts-expect-error
              .emit(io.of('/h').to(s.data.roomID), 'player-joined', clientInfo)
          }),
      },
      logged: {
        beforeRes: (s) => authorizedPlayer(s),
        afterRes: (s) =>
          s.once('ready', () => {
            // @ts-expect-error
            const roomID = s.data.roomID
            const clientID = s.data.userID
            console.log('clientID: ', clientID)
            s.on('disconnect', async () => {
              const isConnectedToHost = await redisDb.sismember(`room:${roomID}:players`, clientID)
              if (isConnectedToHost) {
                await redisDb.srem(`room:${roomID}:players`, clientID)
                await redisDb.decr(`room:${roomID}:total_connections`)
                await redisDb.decr(`room:${roomID}:total_players`)
              }
              emitIO()
                .output(z.union([userSchema, guestSchema]))
                .emit(io.of('/h').to(roomID), 'player-left', clientInfo)
            })

            console.log('player is ready')
            // @ts-expect-error
            const clientInfo = s.data.isLogged ? s.data.user : s.data.guest

            emitIO()
              .output(z.union([userSchema, guestSchema]))
              // @ts-expect-error
              .emit(io.of('/h').to(s.data.roomID), 'player-joined', clientInfo)
          }),
      },
    })
  })
}
