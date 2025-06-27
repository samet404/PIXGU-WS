import { redisDb } from '@/redis'
import { ROOM_ID_LENGTH } from '@/constants'
import { init } from '@paralleldrive/cuid2'

const MAX_RETRY = 5

const createId = init({
  length: ROOM_ID_LENGTH,
})

export const createRoomID = async () => {
  let retry = 0
  let ID
  let isRoomExits = 0

  while (isRoomExits !== 1 || retry > MAX_RETRY) {
    try {
      ID = createId()
      isRoomExits = await redisDb.sadd(`active_rooms`, ID)
    } catch (e) {
      break
    }
    retry++
  }

  return ID
}
