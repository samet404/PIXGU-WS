import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']),
    PORT: z.string(),
    ORIGINS: z.string(),
    NEON_DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    DEV_IP_ADDRESS: z.string().default('168.63.129.16'),
  },
  runtimeEnv: process.env,
})
