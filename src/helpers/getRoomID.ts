import type { SocketAll } from '@/types'
import { z } from 'zod'
import { logErr } from '../utils'

export const getRoomID = (socket: SocketAll) => {
  const roomID: string = socket.handshake.auth.roomID
  try {
    z.string().cuid2().parse(roomID)
  } catch (e) {
    logErr({
      message: 'Error when getting room ID',
      e,
    })
    socket.disconnect()
  }

  return roomID
}
