import { redisDb } from '../db/redis'
import type { Socket } from 'socket.io'
import { env } from '@/env'

export const tooManyConnections = async (socket: Socket) => {
  if (env.NODE_ENV === 'development') return env.DEV_IP_ADDRESS

  // Reverse proxy needs to set x-real-ip header
  const IP = socket.handshake.headers['x-real-ip']
  if (!IP) {
    socket.disconnect()
    return
  }

  socket.data.IP = IP

  const connectionCount = parseInt(
    (await redisDb.get(`IP:${IP}:connection_count`)) || '0',
  )
  console.log('connection_count: ', connectionCount)
  if (connectionCount >= 10) {
    socket.disconnect()
    socket.to(socket.id).emit('too-many-connections')
    return
  }

  await redisDb.incr(`IP:${IP}:connection_count`)
  console.log('incr count')

  socket.once('disconnect', async () => {
    console.log('decr count')
    await redisDb.decr(`IP:${IP}:connection_count`)
  })

  return { connectionCount: connectionCount + 1 }
}
