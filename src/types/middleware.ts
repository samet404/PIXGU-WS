import type { ExtendedError, Socket } from 'socket.io'

export type Middleware = (
  socket: Socket,
  next: (err?: ExtendedError) => void,
) => void
