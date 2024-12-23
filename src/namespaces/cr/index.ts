import { io } from '@/io'
import { onAuth, onConnection } from '@/helpers'
import { onCreateRoom } from './onCreateRoom'
import { onKill } from './onKill'

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
