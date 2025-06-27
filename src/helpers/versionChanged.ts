import { playerIO } from 'namespaces/player'
import {
    REDIS_ROOM_KEYS_BY_ROOM_ID,
    REDIS_ROOM_KEYS_BY_USER_ID,
    REDIS_ROOM_KEYS_BY_VERSION,
    REDIS_ROOM_OTHERS_KEYS,
    VERSION
} from '../constants'
import { redisDb } from '../db/redis'
import { hostIO } from 'namespaces/host'
import { crIO } from 'namespaces/cr'

export const versionChanged = async () => {
    try {
        console.log('VERSION CHANGING')

        // #region Disconnect all players
        playerIO.emit('leave-room', 'UPDATE_REQUIRED')
        playerIO.disconnectSockets()

        hostIO.emit('leave-room', 'UPDATE_REQUIRED')
        hostIO.disconnectSockets()

        crIO.emit('leave-room', 'UPDATE_REQUIRED')
        crIO.disconnectSockets()

        playerIO.removeAllListeners()
        hostIO.removeAllListeners()
        crIO.removeAllListeners()
        // #endregion
        // #region Delete rooms data from redis
        const version = VERSION
        const redisKeysOther = REDIS_ROOM_OTHERS_KEYS
        const redisKeysByVersion = REDIS_ROOM_KEYS_BY_VERSION(version)
        const roomsByVersion = await redisDb.smembers(redisKeysByVersion.createdRooms)

        for (let i = 0; i < roomsByVersion.length; i++) {
            const roomID = roomsByVersion[i]
            const redisKeysByRoomID = REDIS_ROOM_KEYS_BY_ROOM_ID(roomID)

            await redisDb.del(redisKeysByRoomID.admins)
            await redisDb.del(redisKeysByRoomID.createdAt)

            const hostID = (await redisDb.get(redisKeysByRoomID.hostID))!
            await redisDb.del(redisKeysByRoomID.hostID)
            const redisKeysByUserID = REDIS_ROOM_KEYS_BY_USER_ID(hostID)

            await redisDb.srem(redisKeysOther.activeRooms, roomID)
            await redisDb.srem(redisKeysOther.activePublicRooms, roomID)

            await redisDb.srem(redisKeysByUserID.createdRooms, roomID)
            await redisDb.del(redisKeysByRoomID.admins)
            await redisDb.del(redisKeysByRoomID.hostInRoom)
            await redisDb.del(redisKeysByRoomID.name)
            await redisDb.del(redisKeysByRoomID.hostCountry)
            await redisDb.del(redisKeysByRoomID.hostLL)
            await redisDb.del(redisKeysByRoomID.password)
            await redisDb.del(redisKeysByRoomID.playersKnownPass)
            await redisDb.del(redisKeysByRoomID.blockedUsers)
            await redisDb.del(redisKeysByRoomID.totalPlayers)
            await redisDb.del(redisKeysByRoomID.version)
        }

        console.log('VERSION CHANGED')
    } catch (error) {
        console.error('Error in versionChanged:', error)
    }
    // #endregion
}