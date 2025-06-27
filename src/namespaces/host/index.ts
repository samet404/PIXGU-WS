import type {
  AllSocketData,
  Guest,
  HostSocket,
} from '@/types'
import { io } from '@/io'
import { onHostAuth } from './onHostAuth'
import { z } from 'zod'
import { redisDb } from '@/db/redis'
import { emitIO } from 'utils/emitIO'
import { onIO } from 'utils/onIO'
import { onConnection } from 'helpers/onConnection'
import { onAuth } from 'helpers/onAuth'
import { getRoomID } from 'helpers/getRoomID'
import { userSchema } from '@/zod/schema/user'
import { guestSchema } from '@/zod/schema/guest'

export const hostIO = io.of(`/h`)

const ready = async <SData extends AllSocketData>(
  s: HostSocket<SData>,
  roomID: string,
) => {
  const playersIDs: string[] = await redisDb.smembers(`room:${roomID}:players`)
  const players: Guest[] = []
  for (const ID of playersIDs) {
    const isGuest = true

    if (isGuest) {
      const name = await redisDb.get(`guest:${ID}:name`)
      if (!name) continue
      const nameID = await redisDb.get(`guest:${ID}:name_ID`)
      if (!nameID) continue
      const nameWithNameID = await redisDb.get(`guest:${ID}:name_&_name_ID`)
      if (!nameWithNameID) continue
      players.push({
        ID,
        name,
        nameID,
        nameWithNameID,
      } as Guest)
    }
  }

  emitIO()
    .output(z.array(z.union([userSchema, guestSchema])))
    .emit(s, 'prev-players', players)
}

const defaultListeners = <SData extends AllSocketData>(
  s: HostSocket<SData>,
  roomID: string,
) => {
  onIO()
    .input(z.string().cuid2())
    .on(s, 'connection-failed', async (userID) =>
      io
        .of('/p')
        .to(roomID + userID)
        .disconnectSockets(),
    )

  onIO()
    .input(
      z.object({
        count: z.number(),
        IDs: z.array(z.string().cuid2()),
      }),
    )
    .on(s, 'current-players', async (userID) => {
      await redisDb.set(`room:${roomID}:total_players`, userID.count)
      await redisDb.del(`room:${roomID}:players`)

      for (const ID of userID.IDs) {
        await redisDb.sadd(`room:${roomID}:players`, ID)
      }
    })

  onIO()
    .input(z.string().cuid2())
    .on(s, 'not-allowed', async (userID) => {
      io.of('/p')
        .to(roomID + userID)
        .disconnectSockets()
    })

  onIO()
    .input(z.boolean())
    .on(s, 'game-started', async (isMatchStarted) => {
      const hasPass = await redisDb.get(`room:${roomID}:password`)

      if (isMatchStarted) {
        await redisDb.set(`room:${roomID}:game_started`, 1)
        if (!hasPass) await redisDb.srem('active_public_rooms', roomID)
      }

      if (!isMatchStarted) {
        await redisDb.set(`room:${roomID}:game_started`, 0)
        if (!hasPass) await redisDb.sadd('active_public_rooms', roomID)
      }
    })

  onIO()
    .input(
      z.object({
        // TODO: replace with zodSimplePeerSignal
        signal: z.any(),
        userID: z.string(),
      }),
    )
    .on(s, 'send-webrtc-signal', async ({ signal, userID }) => {
      console.log(
        'recevied signal from host',
        JSON.stringify(
          {
            signal,
            userID,
          },
          null,
          2,
        ),
      )

      console.log('signal: ', signal)
      io.of('/p')
        .to(roomID + userID)
        .emit('receive-webrtc-signal', signal)
    })

  s.on('block-user', async (userID: string) => {
    await redisDb.sadd(`room:${roomID}:blocked_users`, userID)
    io.of('/p').to(roomID).emit('blocked', userID)
    io.of('/p')
      .to(roomID + userID)
      .disconnectSockets()
  })
}

export const host = () => {
  onConnection(hostIO, (s) => {
    onAuth(s, {
      logged: {
        beforeRes: (s) => {
          // onHostAuth(s, {
          //   beforeRes: (s) => {
          //     const roomID = getRoomID(s)
          //     s.once('ready', () => ready(s, roomID))
          //     defaultListeners(s, roomID)
          //   },
          // })
        },
      },
      guest: {
        beforeRes: (s) => {
          onHostAuth(s, {
            beforeRes: (s) => {
              const roomID = getRoomID(s)
              s.once('ready', () => ready(s, roomID))
              defaultListeners(s, roomID)
            },
          })
        },
      },
    })
  })
}
