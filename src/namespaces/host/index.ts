import { onAuth, onConnection } from '@/helpers'
import { io } from '@/io'
import { onHostAuth } from './funcs'
import { emitIO, onIO, setRealTimeout } from '@/src/utils'
import { z } from 'zod'
import { guestSchema, userSchema, zodSimplePeerSignal } from '@/zod/schema'
import type { User } from 'lucia'
import type { Guest } from '@/types'
import { db } from '@/src/db/sqlDb'
import { user } from '@/db/sqlDb/schema'
import { eq } from 'drizzle-orm'
import { redisDb } from '@/src/db/redis'
export const hostIO = io.of(`/h`)

export const host = () => {
  onConnection(hostIO, (s) => {
    console.log('onConnection host')
    onAuth(s, {
      logged: {
        beforeRes: (s) => {
          onHostAuth(s, {
            beforeRes: (s) => {
              const roomID = s.data.roomID

              s.once('ready', async () => {
                console.log('host ready')
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
                  } else {
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
                  .emit(io.of('/h').to(roomID), 'prev-players', players)
              })

              onIO().input(z.string().cuid2()).on(s, 'connection-failed', async (userID) => {
                io.of('/p').to(roomID + userID).disconnectSockets()
              })

              onIO().input(z.string().cuid2()).on(s, 'connection-success', async (userID) => {
                console.log('connection-success', userID)
                try {
                  await redisDb.incr(`room:${roomID}:total_players`)
                  await redisDb.incr(`room:${roomID}:total_connections`)
                  await redisDb.sadd(`room:${roomID}:players`, userID)
                } catch (error) {
                  console.error('error when connection-success', error)
                }
              })

              s.on('block-user', async (userID) => {
                await redisDb.sadd(`room:${roomID}:blocked_users`, userID)
                io.of('/p').to(roomID + userID).emit('blocked')
                io.of('/p').to(roomID + userID).disconnectSockets()
              })

              onIO().input(
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


            },
          })
        },
      },
      guest: {
        beforeRes: (s) => {
          onHostAuth(s, {
            beforeRes: (s) => {
              const roomID = s.data.roomID

              s.once('ready', async () => {
                setRealTimeout(async () => {
                  console.log('host ready')
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
                    } else {
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
                    .emit(io.of('/h').to(roomID), 'prev-players', players)
                }, 2000)
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


              s.on('block-user', async (userID) => {
                await redisDb.sadd(`room:${roomID}:blocked_users`, userID)
                io.of('/p').to(roomID).emit('blocked', userID)
                io.of('/p').to(roomID + userID).disconnectSockets(userID)
              })
            },
          })
        },
      },
    })
  })
}
