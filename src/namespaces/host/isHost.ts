import { redisDb } from '@/redis'
import { io } from '@/src'
import { logErr } from '@/utils'
import type { LoggedSocket, OverrideProps } from '@/types'
import { getRoomID } from '@/helpers'

type HostSocket = OverrideProps<
  LoggedSocket,
  {
    data: {
      isHost: true
      roomID: string
    } & LoggedSocket['data']
  }
>

export const isHost = async (
  socket: LoggedSocket,
  cb: (socket: HostSocket) => void,
) => {
  const roomID = getRoomID(socket)

  const isRoomActiveInRedis = await redisDb.sismember('active_rooms', roomID)
  if (isRoomActiveInRedis === 0) {
    logErr(`Room ${roomID} is not active`, new Error())
    socket.disconnect()
    return
  }

  const userID = socket.data.user.id
  const hostID = await redisDb.get(`room:${roomID}:host_ID`)

  console.log(JSON.stringify({ userID, hostID }, null, 2))
  if (userID !== hostID) {
    logErr(`User ${userID} is not the host of room ${roomID}`, new Error())
    socket.disconnect()
    return
  }

  const isInRoom = (await redisDb.get(`room:${roomID}:host_in_room`)) === '1'
  if (isInRoom) {
    socket.emit('error', 'ALREADY_IN_ROOM')
    socket.disconnect()
    return
  }

  socket.on('disconnect', async () => {
    await redisDb.set(`room:${roomID}:host_in_room`, '0')
    await redisDb.decr(`room:${roomID}:total_connections`)
    io.of('/player').emit('host-left', socket.data.user)
  })

  await redisDb.incr(`room:${roomID}:total_connections`)
  socket.emit('host-joined', socket.data.user)
  ;(socket as HostSocket).data.roomID = roomID
  cb(socket as HostSocket)
}
