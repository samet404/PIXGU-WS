import { emitIO, onIO } from '@/utils'
import { isPlayer } from './isPlayer'
import type { GuestSocket, LoggedSocket } from '@/types'
import { zClientID, zodSimplePeerSignal } from '@/zod/schema'
import { z } from 'zod'
import { hostIO } from '../host'

export const authorizedPlayer = (s: GuestSocket | LoggedSocket) =>
  isPlayer(s, (s) =>
    s.on('ready', () => {
      console.log('player is ready')
      const clientID = s.data.isLogged ? s.data.userID : s.data.guestID
      const roomID = s.data.roomID

      onIO.input(zodSimplePeerSignal).on(s, 'send-webrtc-signal', (signal) => {
        emitIO
          .output(
            z.object({
              userID: zClientID,
              signal: zodSimplePeerSignal,
            }),
          )
          .emit(hostIO.to(roomID), 'receive-webrtc-signal', {
            userID: clientID,
            signal,
          })
      })
    }),
  )
