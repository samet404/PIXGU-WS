import type { Config } from 'drizzle-kit';
import { env } from '@/env';

export default {
  schema: './src/server/db/sqlDb/schema',
  out: './src/server/db/sqlDb',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.XATA_CONNECTION_STRING,
  },

  verbose: true,
  strict: true,
} satisfies Config;
