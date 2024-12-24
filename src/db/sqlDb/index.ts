import * as schema from './schema'
import { env } from '@/src/env'
import { drizzle } from 'drizzle-orm/neon-http'

export const db = drizzle(env.NEON_DATABASE_URL, {
  schema,
  logger: true,
});
