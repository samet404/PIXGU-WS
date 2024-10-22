import { io } from '@/io'
import { onAuth, onConnection } from '@/helpers'
import { onCreateRoom } from './onCreateRoom'

export const cr = () => {
  const crIO = io.of('/cr')

  onConnection(crIO, (s) =>
    onAuth(s, {
      guest: {
        beforeRes: (s) => onCreateRoom(s),
      },
      logged: {
        beforeRes: (s) => onCreateRoom(s),
      },
    }),
  )
}
