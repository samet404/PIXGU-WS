import { redisDb } from '@/redis'
import { io } from '@/src'
import { getRoomID } from '@/helpers'
import type { LoggedSocket, OverrideProps } from '@/types'
import chalk from 'chalk'

type PlayerSocket = OverrideProps<
  LoggedSocket,
  {
    data: {
      isPLayer: true
      roomID: string
    } & LoggedSocket['data']
  }
>

export const isPlayer = async (
  socket: LoggedSocket,
  cb: (socket: PlayerSocket) => void,
) => {
  const errLog = (a: any) => console.log(chalk.redBright(a))
  const roomID = getRoomID(socket)
  const userID = socket.data.user.id

  if (!roomID) {
    errLog(`No room ID found`)
    socket.disconnect()
    return
  }

  const isRoomActiveInRedis =
    (await redisDb.sismember('active_rooms', roomID)) === 0
  if (isRoomActiveInRedis) {
    errLog(`Room ${roomID} is not active`)
    socket.disconnect()
    return
  }

  const isInRoom =
    (await redisDb.sismember(`room:${roomID}:players`, userID)) === 1
  if (isInRoom) {
    errLog(`User ${userID} is already in room ${roomID}`)
    socket.to(socket.id).emit('already-in-room')
    socket.disconnect()
    return
  }

  socket.on('disconnect', async () => {
    await redisDb.srem(`room:${roomID}:players`, userID)
    await redisDb.decr(`room:${roomID}:total_connections`)
    io.of('/host').emit('player-left', socket.data.user)
  })

  await redisDb.incr(`room:${roomID}:total_connections`)
  await redisDb.sadd(`room:${roomID}:players`, userID)
  io.of('/host').to(roomID).emit('player-joined', socket.data.user)
  ;(socket as PlayerSocket).data.isPLayer = true
  ;(socket as PlayerSocket).data.roomID = roomID
  socket.join(roomID)
  cb(socket as PlayerSocket)
}
