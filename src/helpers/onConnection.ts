import chalk from 'chalk'
import type { Namespace, Server, Socket } from 'socket.io'
import { tooManyConnections } from '../middleware'
import { redisDb } from '../db/redis'
import { env } from '../env'

export const onConnection = async (
  io: Server | Namespace,
  cb: (socket: Socket) => void,
) => {
  const log = console.log
  const positiveLog = (...a: any) => log(chalk.greenBright(a))
  const negativeLog = (...a: any) => log(chalk.redBright(a))
  const xNegativeLog = (...a: any) => log(chalk.bgRed(a))

  io.on('connection', async (socket) => {
    const connectionsCount = await tooManyConnections(socket)

    const namespaceName = socket.nsp.name
    positiveLog(
      JSON.stringify(
        {
          message: `Socket connected`,
          socketID: socket.id,
          namespace: namespaceName,
          IP: socket.data.IP,
          connectionCount: connectionsCount,
        },
        null,
        2,
      ),
    )

    socket.once('disconnect', async () => {
      negativeLog(
        JSON.stringify(
          {
            message: `Socket disconnected`,
            socketID: socket.id,
            namespace: namespaceName,
            IP: socket.data.IP,
            connectionCount:
              env.NODE_ENV === 'production'
                ? (await redisDb.get(
                    `IP:${socket.data.IP}:connection_count`,
                  )) || '0'
                : undefined,
          },
          null,
          2,
        ),
      )
    })

    socket.on('error', (err) => {
      xNegativeLog(`Socket error: ${socket.id} from ${namespaceName}`, err)
      console.error(err)
    })

    cb(socket)
  })
}
