import { io } from '@/src'
import { onAuth } from '@/helpers'

export const base = () => {
  io.on('connection', (socket) =>
    onAuth(
      socket,
      () => {},
      () => {},
    ),
  )
}
