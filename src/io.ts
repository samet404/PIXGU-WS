import chalk from 'chalk'
import { env } from './env'
import { Server, type ServerOptions } from 'socket.io'
import { createServer } from 'node:http'
import express from 'express'

const port = parseInt(env.PORT)
const app = express()
const server = createServer(app)

const serverOptions: Partial<ServerOptions> = {
  /* options here */
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
io.listen(port)

log(`${chalk.yellowBright(`\n Listening on port ${port}`)} ⚡️`)

io.engine.on('connection_error', (err) => {
  console.log('io.engine.on connection_error: ', err)
})
