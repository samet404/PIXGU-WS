import { io } from '@/src'
import { onAuth, onConnection } from '@/helpers'
import { onCreateRoom } from './onCreateRoom'

export const cr = () => {
  const crIO = io.of('/cr')

  onConnection(crIO, (s) =>
    onAuth(s, {
      both: (s) => onCreateRoom(s),
    }),
  )
}
