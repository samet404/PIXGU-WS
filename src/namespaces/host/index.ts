import type { User } from 'lucia'
import type { AllSocketData, Guest, HostSocket, IsSocket, JoinedSocket } from '@/types'
import { getRoomID, onAuth, onConnection } from '@/helpers'
import { io } from '@/io'
import { onHostAuth } from './funcs'
import { emitIO, onIO } from '@/utils'
import { z } from 'zod'
import { guestSchema, userSchema } from '@/zod/schema'
import { db } from '@/sqlDb'
import { user } from '@/sqlDb/schema'
import { eq } from 'drizzle-orm'
import { redisDb } from '@/db/redis'

export const hostIO = io.of(`/h`)

const ready = async <SData extends AllSocketData>(s: HostSocket<SData>, roomID: string) => {
  const playersIDs: string[] = await redisDb.smembers(
    `room:${roomID}:players`,
  )
  const players: (User | Guest)[] = []
  for (const ID of playersIDs) {
    const isGuest = ID.length === 22

    if (isGuest) {
      const name = await redisDb.get(`guest:${ID}:name`)
      if (!name) continue
      const nameID = await redisDb.get(`guest:${ID}:name_ID`)
      if (!nameID) continue
      const nameWithNameID = await redisDb.get(
        `guest:${ID}:name_&_name_ID`,
      )
      if (!nameWithNameID) continue
      players.push({
        ID,
        name,
        nameID,
        nameWithNameID,
      } as Guest)
    }
    else {
      const logged: User = (
        await db
          .select({
            id: user.id,
            username: user.username,
            usernameID: user.usernameID,
            usernameWithUsernameID: user.usernameWithUsernameID,
            profilePicture: user.profilePicture,
          })
          .from(user)
          .where(eq(user.id, ID))
      )[0]

      if (!logged) continue
      players.push(logged)
    }
  }

  emitIO()
    .output(z.array(z.union([userSchema, guestSchema])))
    .emit(s, 'prev-players', players)
}

const defaultListeners = <SData extends AllSocketData>(s: HostSocket<SData>, roomID: string) => {
  onIO().input(z.string().cuid2()).on(s, 'connection-failed', async (userID) => io.of('/p').to(roomID + userID).disconnectSockets())

  onIO()
    .input(z.object({
      locale: z.union([z.literal('en'), z.literal('tr')]),
      count: z.number().min(1).max(10).default(2),
    }))
    .on(s, 'get-random-themes', async ({ locale, count }) => {
      emitIO()
        .output(z.array(z.string()))
        .emit(s, 'random-themes', await redisDb.srandmember(`room_themes:${locale}`, count))
    })


  onIO()
    .input(z.object({
      locale: z.union([z.literal('en'), z.literal('tr')]),
      count: z.number().min(1).max(10).default(2),
      userID: z.string().cuid2(),
    }))
    .on(s, 'change-themes', async ({ locale, count, userID }) => {
      emitIO()
        .output(z.object({
          themes: z.array(z.string()),
          userID: z.string().cuid2(),
        }))
        .emit(s, 'change-themes', {
          themes: await redisDb.srandmember(`room_themes:${locale}`, count),
          userID,
        })
    })


  onIO()
    .input(z.object({
      locale: z.union([z.literal('en'), z.literal('tr')]),
      theme: z.string(),
      userID: z.string().cuid2(),
    }))
    .on(s, 'category-hint', async ({ theme, locale, userID }) => {
      const category = await redisDb.get(`room_themes:${locale}:${theme}:category`)
      console.log('category-hint: ', category)
      if (!category) return

      emitIO().output(z.object({
        category: z.string(),
        userID: z.string().cuid2(),
      })).emit(s, 'category-hint', {
        category: category,
        userID,
      })
    })

  onIO().input(z.object({
    count: z.number(),
    IDs: z.array(z.string().cuid2())
  })).on(s, 'current-players', async (userID) => {
    await redisDb.set(`room:${roomID}:total_players`, userID.count)
    await redisDb.del(`room:${roomID}:players`)

    for (const ID of userID.IDs) {
      await redisDb.sadd(`room:${roomID}:players`, ID)
    }
  })

  onIO().input(z.string().cuid2()).on(s, 'not-allowed', async (userID) => {
    io.of('/p').to(roomID + userID).disconnectSockets()
  })

  onIO().input(z.boolean()).on(s, 'game-started', async (isMatchStarted) => {
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
        //zodSimplePeerSignal
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
    io.of('/p').to(roomID + userID).disconnectSockets()
  })
}

export const host = () => {
  onConnection(hostIO, (s) => {
    onAuth(s, {
      logged: {
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
