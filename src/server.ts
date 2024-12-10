import { runAll } from './utils'
import { base, cr, host, player, test } from './namespaces'
import { getEveryoneOutRoomsInRedis } from './helpers'
import { seed } from './db/redis/seed'
import { env } from './env'

env.NODE_ENV === 'production' && seed()
console.log('dsoapdjopsa')
runAll(
  // first
  getEveryoneOutRoomsInRedis,
  // middlewares
  base,
  host,
  player,
  test,
  cr,
)

console.log(`------------------------------- \n \n`)
