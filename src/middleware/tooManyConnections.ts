import { redisDb } from '../db/redis'
import type { Socket } from 'socket.io'
import { env } from '@/env'

export const tooManyConnections = async (socket: Socket) => {

  const IP = socket.handshake.headers['x-forwarded-for']
  console.log('headers: ', JSON.stringify(socket.handshake.headers, null, 2))
  console.log('IP: ', IP)
  if (!IP) {
    socket.disconnect()
    return
  }

  socket.data.IP = IP
  if (env.NODE_ENV === 'development') return
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
