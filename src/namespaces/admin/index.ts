import { validateAdmin } from '@/src/auth/admin'
import { onConnection, prepareRestart, setLastVersion, versionChanged } from '@/helpers'
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
        s.on('flushall-except-users', () => flushAllExceptStartsWith(['user:', 'guest:']))
        s.on('flushall', () => redisDb.flushall())
    })

}