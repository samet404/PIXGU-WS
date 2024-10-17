import { emitIO, onIO } from '@/utils'
import { onAuth, onConnection } from '@/helpers'
import { isHost } from './isHost'
import { z } from 'zod'
import { zodSimplePeerSignal } from '@/zod/schema'
import { io } from '@/src'
import { redisDb } from '@/redis'

export const host = () => {
  const hostIO = io.of(`/host`)

  onConnection(hostIO, (s) => {
    console.log('onConnection host')
    onAuth(s, {
      logged: (s) => {
        console.log('isHost 2')

        isHost(s, async (s) => {
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
                (await redisDb.sismember(`room:${roomID}:players`, userID)) ===
                1

              if (!isUserInRoom) {
                s.to(s.id).emit('send-webrtc-signal-error', 'USER_NOT_FOUND')
                return
              }

              emitIO.emit(
                io.of('/player').to(userID),
                'receive-webrtc-signal',
                signal,
              )
            })
        })
      },
    })
  })
}
