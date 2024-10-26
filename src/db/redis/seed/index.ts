import { redisDb } from '@/db/redis'
import { themes } from './data.json'

console.log('Redis flushed ✅')

await redisDb.flushall()
Object.keys(themes).forEach((lang) =>
  themes[lang as keyof typeof themes].forEach(
    async (theme) => await redisDb.sadd(`room_themes:${lang}`, theme),
  ),
)
console.log('Themes added to redis ✅')
console.log('Seeding done ✅')
