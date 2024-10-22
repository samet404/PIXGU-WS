import { z } from 'zod'

export const zodSimplePeerSignal = z.union([
  z.object({
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
  }),

  z.object({
    type: z.literal('renegotiate'),
    renegotiate: z.boolean(),
  }),

  z.object({
    type: z.literal('candidate'),
    candidate: z.any(),
  }),

  z.object({
    sdp: z.string().optional(),
    type: z.union([
      z.literal('answer'),
      z.literal('offer'),
      z.literal('pranswer'),
      z.literal('rollback'),
    ]),
  }),
])
