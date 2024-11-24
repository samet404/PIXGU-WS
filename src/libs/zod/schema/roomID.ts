import { ROOM_ID_LENGTH } from '@/constants'
import { z } from 'zod'

export const RoomID = z.string().length(ROOM_ID_LENGTH).cuid2()