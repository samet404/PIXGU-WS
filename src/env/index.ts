import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']),
    LOGS: z.enum(['0', '1']),
    PORT: z.string(),
    ORIGINS: z.string(),
    XATA_BRANCH: z.string(),
    XATA_API_KEY: z.string(),
    XATA_CONNECTION_STRING: z.string(),
    REDIS_URL: z.string(),
    ROOT_FOLDER_NAME: z.string(),
  },
  runtimeEnv: process.env,
})
