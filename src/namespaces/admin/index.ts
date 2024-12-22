import { validateAdmin } from '@/src/auth/admin'
import { onConnection, prepareRestart, setLastVersion, versionChanged } from '@/helpers'
import { io } from '@/src/io'
import { flushAllExceptStartsWith } from '@/utils'

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
        s.on('flushall', () => flushAllExceptStartsWith(['user:', 'guest:']))
    })
}