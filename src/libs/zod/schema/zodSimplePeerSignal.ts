import { z } from 'zod'

export const zodSimplePeerSignal = z
  .object({
    type: z.literal('transceiverRequest'),
    transceiverRequest: z.object({
      kind: z.string(),
      init: z
        .object({
          direction: z
            .union([
              z.literal('inactive'),
              z.literal('recvonly'),
              z.literal('sendonly'),
              z.literal('sendrecv'),
              z.literal('stopped'),
            ])
            .optional(),

          sendEncodings: z.any().optional(),

          streams: z.array(z.any()).optional(),
        })
        .nullish(),
    }),
  })
  .or(
    z.object({
      type: z.literal('renegotiate'),
      renegotiate: z.boolean(),
    }),
  )
  .or(
    z.object({
      type: z.literal('candidate'),
      candidate: z.any(),
    }),
  )
  .or(
    z.object({
      sdp: z.string().optional(),
      type: z
        .literal('answer')
        .or(z.literal('offer'))
        .or(z.literal('pranswer'))
        .or(z.literal('rollback')),
    }),
  )
