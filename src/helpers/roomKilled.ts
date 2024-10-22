import type { Namespace } from 'socket.io'
import type { SocketAll } from '../types'
import { emitIO } from '../utils'

export const emitRoomKilled = async (
  s: SocketAll | Namespace,
  data: RoomKilled,
) => emitIO.emit(s, 'room-killed', data)

type RoomKilled = {
  reason: 'TIME_IS_UP' | 'SERVER_RESTARTED'
}
