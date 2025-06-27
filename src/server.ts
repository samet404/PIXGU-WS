import { admin } from 'namespaces/admin'
import { base } from 'namespaces/base'
import { cr } from 'namespaces/cr'
import { host } from 'namespaces/host'
import { player } from 'namespaces/player'
import { runAll } from 'utils/runAll'

runAll(
  base,
  host,
  player,
  admin,
  cr,
)

console.log(`------------------------------- \n \n`)
