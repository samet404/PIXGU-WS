import type { GuestSocket, LoggedSocket } from '@/src/types'
import { isHost } from './isHost'
import { redisDb } from '@/db/redis'
import { emitIO, onIO } from '@/utils'
import { z } from 'zod'
import { io } from '@/io'
import { zodSimplePeerSignal } from '@/zod/schema'
import { playerIO } from '../../player'

export const authorizedHost = (s: GuestSocket | LoggedSocket) =>
  isHost(s, (s) =>
    s.on('ready', async () => {
      {
        const roomID = s.data.roomID
        const playersIDs: string[] = await redisDb.smembers(
          `room:${roomID}:players`,
        )

        emitIO
          .output(z.array(z.string().cuid2()))
          .emit(io.of('/host').to(s.data.roomID), 'prev-players', playersIDs)

        onIO
          .input(
            z.object({
              signal: zodSimplePeerSignal,
              userID: z.string(),
            }),
          )
          .on(s, 'send-webrtc-signal', async ({ signal, userID }) => {
            const isUserInRoom =
              (await redisDb.sismember(`room:${roomID}:players`, userID)) === 1

            if (!isUserInRoom) {
              s.emit('send-webrtc-signal-error', 'USER_NOT_FOUND')
              return
            }

            emitIO
              .output(zodSimplePeerSignal)
              .emit(
                playerIO.to(roomID + userID),
                'receive-webrtc-signal',
                signal,
              )
          })
      }
    }),
  )
