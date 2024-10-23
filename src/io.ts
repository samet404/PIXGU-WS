import chalk from 'chalk'
import { env } from './env'
import { Server, type ServerOptions } from 'socket.io'
import express from 'express'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const port = parseInt(env.PORT)
const app = express()

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const server = await (async () => {
  if (env.NODE_ENV === 'development') {
    const createServer = (await import('node:http')).createServer

    return createServer(app)
  } else if (env.NODE_ENV === 'production') {
    const { createServer } = await import('https')
    const fs = await import('fs')

    return createServer(
      {
        cert: fs.readFileSync(`${__dirname}/ssl/domain.cert.pem`),
        key: fs.readFileSync(`${__dirname}/ssl/private.key.pem`),
      },
      app,
    )
  }
})()

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
