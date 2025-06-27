import type { Socket } from 'socket.io'
import { emitIO } from 'utils/emitIO'
import { z } from 'zod'

const errSchema = z.union([
  z.literal('REACHED_MAX_ROOMS'),
  z.literal('GEOLOCATION_INFORMATION_NOT_FOUND'),
  z.literal('INTERNAL_SERVER_ERROR'),
])

export const emitErr = (s: Socket, err: z.infer<typeof errSchema>) =>
  emitIO().output(errSchema).emit(s, 'cr-error', err)
