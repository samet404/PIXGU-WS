import { redisDb } from '@/db/redis'
import { themes } from './data.json'

export const setThemes = async () => {
  console.log('Redis flushed ✅')

  Object.keys(themes).forEach((lang) =>
    themes[lang as keyof typeof themes].forEach(
      async ([theme, category]) => {
        await redisDb.sadd(`room_themes:${lang}`, theme)
        await redisDb.set(`room_themes:${lang}:${theme}:category`, category)
        await redisDb.set(`room_themes:${category}`, theme)
      },
    ),
  )

  console.log('Themes added to redis ✅')
  console.log('Seeding done ✅')
}
