import { emitIO } from '@/utils'
import type { SocketAll } from '@/types'
import { z } from 'zod'

const errSchema = z.union([
  z.literal('REACHED_MAX_ROOMS'),
  z.literal('GEOLOCATION_INFORMATION_NOT_FOUND'),
  z.literal('INTERNAL_SERVER_ERROR'),
])

export const emitErr = (s: SocketAll, err: z.infer<typeof errSchema>) =>
  emitIO().output(errSchema).emit(s, 'cr-error', err)
