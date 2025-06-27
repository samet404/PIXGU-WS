export const MAX_PLAYERS_PER_ROOM = 10

export const REDIS_ROOM_KEYS_BY_USER_ID = (userID: string) => ({
    createdRooms: `created_rooms:user:${userID}`,
})

export const REDIS_ROOM_KEYS_BY_ROOM_ID = (roomID: string) => ({
    name: `room:${roomID}:name`,
    admins: `room:${roomID}:admins`,
    createdAt: `room:${roomID}:created_at`,
    hostID: `room:${roomID}:host_ID`,
    hostInRoom: `room:${roomID}:host_in_roomID`,
    hostCountry: `room:${roomID}:host_country`,
    hostLL: `room:${roomID}:host_LL`,
    password: `room:${roomID}:password`,
    playersKnownPass: `room:${roomID}:players_known_pass`,
    blockedUsers: `room:${roomID}:blocked_users`,
    totalPlayers: `room:${roomID}:total_players`,
    version: `room:${roomID}:version`,
})

export const REDIS_ROOM_KEYS_BY_VERSION = (version: string) => ({
    createdRooms: `version:${version}:rooms`,
})

export const REDIS_ROOM_OTHERS_KEYS = {
    activePublicRooms: `active_public_rooms`,
    activeRooms: `active_rooms`,
}

export const REDIS_KEYS_STARTS_WITH_ABOUT_USER = ['user:', 'guest:']

export const ROOM_ID_LENGTH = 5

export const VERSION = 'ALPHA 1.0.0'