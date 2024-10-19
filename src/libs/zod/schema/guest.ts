import { z } from 'zod'

export const guestSchema = z.object({
  ID: z.string(),
  name: z.string(),
  nameID: z.string(),
  nameWithNameID: z.string(),
})
