import { z } from 'zod'

export const zClientID = z.string().cuid2()
