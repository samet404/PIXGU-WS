import { redisDb } from '../db/redis'
import type { Socket } from 'socket.io'
import { env } from '@/env'
import { z } from 'zod'

const MAX_CONNECTIONS_PER_IP = 10
const REDIS_KEY_PREFIX = 'IP:'
const REDIS_KEY_SUFFIX = ':connection_count'

export const tooManyConnections = async (socket: Socket) => {
  try {
    setSocketIP(socket)

    const clientIP = socket.data.IP
    if (!clientIP) {
      throw new Error('Client IP not found')
    }

    if (env.NODE_ENV === 'development') {
      return { connectionCount: 0 }
    }

    const currentConnections = await getCurrentConnectionCount(clientIP)

    if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
      handleTooManyConnections(socket)
      return
    }

    await incrementConnectionCount(clientIP)
    setupDisconnectHandler(socket, clientIP)

    return { connectionCount: currentConnections + 1 }
  } catch (error) {
    console.error('Error in tooManyConnections:', error)
    socket.disconnect()
    return
  }
}

const setSocketIP = (socket: Socket): void => {
  if (env.NODE_ENV === 'development') {
    socket.data.IP = env.DEV_IP_ADDRESS
  } else if (env.NODE_ENV === 'production') {
    const ip = socket.handshake.headers['cf-connecting-ip']
    z.string().ip().parse(ip)
    socket.data.IP = ip
  }
}

const getCurrentConnectionCount = async (ip: string): Promise<number> => {
  const count = await redisDb.get(`${REDIS_KEY_PREFIX}${ip}${REDIS_KEY_SUFFIX}`)
  return parseInt(count || '0')
}

const handleTooManyConnections = (socket: Socket): void => {
  socket.disconnect()
  socket.to(socket.id).emit('too-many-connections')
}

const incrementConnectionCount = async (ip: string): Promise<void> => {
  await redisDb.incr(`${REDIS_KEY_PREFIX}${ip}${REDIS_KEY_SUFFIX}`)
}

const setupDisconnectHandler = (socket: Socket, ip: string): void => {
  socket.once('disconnect', async () => {
    await redisDb.decr(`${REDIS_KEY_PREFIX}${ip}${REDIS_KEY_SUFFIX}`)
  })
}