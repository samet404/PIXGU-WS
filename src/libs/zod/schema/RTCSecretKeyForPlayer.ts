import { z } from 'zod';

export const RTCSecretKeyForPlayer = z.object({
    secretKey: z.string().cuid2()
})