import { redisDb } from '@/db/redis'
import { io } from '@/io*'
import { validateAdmin } from 'auth/admin/validate'
import { onConnection } from 'helpers/onConnection'
import { prepareRestart } from 'helpers/prepareRestart'
import { setLastVersion } from 'helpers/setLastVersion'
import { versionChanged } from 'helpers/versionChanged'
import { flushAllExceptStartsWith } from 'utils/flushAllExceptStartsWith'

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