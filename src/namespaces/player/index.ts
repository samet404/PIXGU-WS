import { io } from '@/src'
import { emitIO, onIO } from '@/utils'
import { onAuth, onConnection } from '@/helpers'
import { isPlayer } from './isPlayer'
import { z } from 'zod'
import { userSchema, zodSimplePeerSignal } from '@/zod/schema'

export const player = () => {
  const playerIO = io.of(`/player`)

  onConnection(playerIO, (s) => {
    onAuth(
      s,
      (s) =>
        isPlayer(s, (s) => {
          emitIO
            .output(userSchema)
            .emit(
              io.of('/host').to(s.data.roomID),
              'player-joined',
              s.data.user,
            )

          onIO
            .input(zodSimplePeerSignal)
            .on(s, 'send-webrtc-signal', (signal) => {
              emitIO
                .output(
                  z.object({
                    userID: z.string(),
                    signal: z.object({}),
                  }),
                )
                .emit(
                  io.of('/host').to(s.data.roomID),
                  'receive-webrtc-signal',
                  {
                    userID: s.data.userID,
                    signal,
                  },
                )
            })
        }),
      () => isPlayer(s, (s) => {}),
    )
  })
}
