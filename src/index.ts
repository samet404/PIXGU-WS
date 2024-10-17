console.log(`------------------------------- \n \n`)
import chalk from 'chalk'
import { base, cr, host, player, test } from './namespaces'
import { env } from './env'
import { Server, type ServerOptions } from 'socket.io'
import { createServer } from 'node:http'
import express from 'express'
import { runAll } from './utils'

const port = parseInt(env.PORT)
const app = express()
const server = createServer(app)

const serverOptions: Partial<ServerOptions> = {
  /* options */
  cors: {
    origin: env.ORIGINS.split(','),
    credentials: true,
  },
}

const log = console.log
log(
  `${chalk.magentaBright.bold(
    JSON.stringify(
      {
        socketio: serverOptions,
        env: env,
        port: port,
      },
      null,
      2,
    ),
  )}`,
)

export const io = new Server(server, serverOptions)

runAll(base, host, player, test, cr)

log(`${chalk.yellowBright(`\n Listening on port ${port}`)} ⚡️`)
console.log(`------------------------------- \n \n`)

io.listen(port)
io.engine.on('connection_error', (err) => {
  console.log('io.engine.on connection_error: ', err)
})
