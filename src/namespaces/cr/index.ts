import { io } from '@/io'
import { onAuth, onConnection } from '@/helpers'
import { onCreateRoom } from './onCreateRoom'
import { onKill } from './onKill'

export const cr = () => {
  const crIO = io.of('/cr')

  onConnection(crIO, (s) =>
    onAuth(s, {
      guest: {
        beforeRes: (s) => {
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
