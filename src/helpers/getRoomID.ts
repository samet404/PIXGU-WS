import { z } from 'zod'
import { ROOM_ID_LENGTH } from '../constants'
import type { AllSocketTypes, IsSocket } from '../types'

export const getRoomID = <T extends AllSocketTypes>(s: IsSocket<T> extends never ? never : T) => {
  const roomID: string = s.handshake.auth.roomID

  try {
    z.string().cuid2().length(ROOM_ID_LENGTH).parse(roomID)
  } catch (e) {
    console.error('Invalid roomID: ', roomID, s.id)
    s.disconnect()
  }

  return roomID
}
