import { io } from '@/io'
import { onAuth, onConnection } from '@/helpers'

export const base = () => onConnection(io, (s) => {
  console.log('base connected')
})
