import * as schema from './schema';
import { drizzle } from 'drizzle-orm/xata-http';
import { getXataClient } from '@/src/xata';

const xata = getXataClient();

export const db = drizzle(xata, {
  schema,
  logger: true,
});
