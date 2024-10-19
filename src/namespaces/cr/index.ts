import { io } from '@/io'
import { onAuth, onConnection } from '@/helpers'
import { onCreateRoom } from './onCreateRoom'

export const cr = () => {
  const crIO = io.of('/cr')

  onConnection(crIO, (s) =>
    onAuth(s, {
      guest: (s) => onCreateRoom(s),
      logged: (s) => onCreateRoom(s),
    }),
  )
}
