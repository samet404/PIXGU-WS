import { VERSION } from '../constants';
import { redisDb } from '../db/redis';

await redisDb.set('last_version', VERSION)