import { env } from '@/env'
import Redis from 'ioredis'

export const redisDb = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT ? parseInt(env.REDIS_PORT) : undefined,
  password: env.REDIS_PASSWORD,
})

redisDb.on('error', (err) => {
  throw new Error(`Redis connection error: `, err)
})
