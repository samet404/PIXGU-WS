import { z } from 'zod'
import { ROOM_ID_LENGTH } from '../constants'
import type { Socket } from 'socket.io'

export const getRoomID = (s: Socket) => {
  const roomID: string = s.handshake.auth.roomID

  try {
    z.string().cuid2().length(ROOM_ID_LENGTH).parse(roomID)
  } catch (e) {
    console.error('Invalid roomID: ', roomID, s.id)
    s.disconnect()
  }

  return roomID
}
