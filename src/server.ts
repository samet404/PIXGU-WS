import { runAll } from './utils'
import { base, cr, host, player, test } from './namespaces'
import { getEveryoneOutRoomsInRedis } from './helpers'
import { seed } from './db/redis/seed'
seed()
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
