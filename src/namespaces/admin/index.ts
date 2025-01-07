import { validateAdmin } from '@/src/auth/admin'
import { clearThemes, onConnection, prepareRestart, setLastVersion, setThemes, versionChanged } from '@/helpers'
import { io } from '@/src/io'
import { flushAllExceptStartsWith } from '@/utils'
import { redisDb } from '@/src/db/redis'

export const adminIO = io.of(`/admin`)

export const admin = () => {
    onConnection(adminIO, (s) => {
        validateAdmin(s)

        s.on('disconnect', () => {
            console.log('admin disconnected')
        })

        s.on('version-changed', versionChanged)
        s.on('set-last-version', setLastVersion)
        s.on('prepare-restart', prepareRestart)
        s.on('set-themes', setThemes)
        s.on('clear-themes', clearThemes)
        s.on('flushall-except-essential', () => flushAllExceptStartsWith(['user:', 'guest:', 'room_themes:']))
        s.on('flushall', () => redisDb.flushall())
    })
}