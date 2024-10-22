import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']),
    PORT: z.string(),
    ORIGINS: z.string(),
    XATA_BRANCH: z.string(),
    XATA_API_KEY: z.string(),
    XATA_CONNECTION_STRING: z.string(),
    REDIS_URL: z.string(),
    DEV_IP_ADDRESS: z.string().default('78.190.203.78'),
  },
  runtimeEnv: process.env,
})
