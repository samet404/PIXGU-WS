import { emitIO, onIO } from '@/utils'
import { isPlayer } from './isPlayer'
import { zClientID, zodSimplePeerSignal } from '@/zod/schema'
import { z } from 'zod'
import { hostIO } from '../host'
import type { Contains, GuestSocketData, LoggedSocketData, OverrideProps } from '@/types'
import type { Socket } from 'socket.io'

type ContainsOneOfThese = LoggedSocketData | GuestSocketData
type ReturnedSocket = OverrideProps<Socket, {
  data: ContainsOneOfThese & {
    isPlayer: boolean
    roomID: string
  }
}>

export const authorizedPlayer = <T>(s: Contains<ContainsOneOfThese, T> extends never ? never : ReturnedSocket) =>
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
