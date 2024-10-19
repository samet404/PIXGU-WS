import type { SocketAll } from '@/types'
import { z } from 'zod'

export const getRoomID = (s: SocketAll) => {
  const roomID: string = s.handshake.auth.roomID
  try {
    z.string().cuid2().parse(roomID)
  } catch (e) {
    console.error('Invalid roomID: ', roomID, s.id)
    s.disconnect()
  }

  return roomID
}
