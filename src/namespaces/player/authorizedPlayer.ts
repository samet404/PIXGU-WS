import { isPlayer } from './isPlayer'
import { z } from 'zod'
import { hostIO } from '../host'
import type { Socket } from 'socket.io'
import { onIO } from 'utils/onIO'
import { emitIO } from 'utils/emitIO'
import { zClientID } from '@/zod/schema/clientID'
import { zodSimplePeerSignal } from '@/zod/schema/zodSimplePeerSignal'

export const authorizedPlayer = (s: Socket) =>
  isPlayer(s, (s) => {
    console.log('player is ready')
    const clientID = s.data.isLogged ? s.data.userID : s.data.guestID
    const roomID = s.data.roomID

    onIO()
      .input(
        //zodSimplePeerSignal
        z.any(),
      )
      .on(s, 'send-webrtc-signal', (signal) => {
        emitIO()
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
  })
