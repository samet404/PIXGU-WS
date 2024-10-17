import { env } from '@/env'
import Redis from 'ioredis'

export const redisDb = new Redis(env.REDIS_URL)

redisDb.on('error', (err) => {
  throw new Error(`Redis connection error: `, err)
})
