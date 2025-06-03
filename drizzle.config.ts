import type { Config } from 'drizzle-kit';
import { env } from '@/env';

export default {
  schema: './src/server/db/sqlDb/schema',
  out: './src/server/db/sqlDb',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.NEON_DATABASE_URL,
  },

  verbose: true,
  strict: true,
} satisfies Config;
