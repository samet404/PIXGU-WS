import { io } from '@/io'
import { onConnection } from 'helpers/onConnection'

export const base = () => onConnection(io, (s) => {
  console.log('base connected')
})
