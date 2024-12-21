import { z } from 'zod';

export const RTCSecretKeyForHost = z.object({
    userID: z.string().cuid2(),
    secretKey: z.string().cuid2()
})