import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  profilePicture: z.string().nullable(),
  username: z.string(),
  usernameID: z.string(),
  usernameWithUsernameID: z.string(),
})
