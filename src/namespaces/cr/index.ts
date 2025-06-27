import { io } from '@/io'
import { onCreateRoom } from './onCreateRoom'
import { onKill } from './onKill'
import { onConnection } from 'helpers/onConnection'
import { onAuth } from 'helpers/onAuth'

export const crIO = io.of('/cr')

export const cr = () => {
  onConnection(crIO, (s) =>
    onAuth(s, {
      guest: {
        beforeRes: (s) => {
          console.log('cr auth')

          onCreateRoom(s)
          onKill(s)
        },
      },
      logged: {
        beforeRes: (s) => {
          onCreateRoom(s)
          onKill(s)
        },
      },
    }),
  )
}
