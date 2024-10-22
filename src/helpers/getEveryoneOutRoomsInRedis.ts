import { redisDb } from '../db/redis'

export const getEveryoneOutRoomsInRedis = async () => {
  const activeRooms = await redisDb.smembers('active_rooms')
  console.log('Total active rooms: ', activeRooms.length)
  for (const roomID of activeRooms) {
    const redisKeys = {
      players: `room:${roomID}:players`,
      hostInRoom: `room:${roomID}:host_in_room`,
    }

    for (const key of Object.values(redisKeys)) {
      console.log('deleting ', key)
      await redisDb.del(key)
    }
  }
}
