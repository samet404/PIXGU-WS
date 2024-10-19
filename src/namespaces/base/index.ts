import { io } from '@/io'
import { onAuth } from '@/helpers'

export const base = () => {
  io.on('connection', (s) => onAuth(s, {}))
}
