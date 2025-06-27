import { env } from '@/env'
import type { Socket } from 'socket.io'
import { z } from 'zod'

export const validateAdmin = (s: Socket) => {
    try {
        console.log('admin validating...')

        const authToken = s.handshake.auth.token
        if (!authToken) throw new Error('No authToken')

        z.string().min(40).parse(authToken)
        if (authToken !== env.AUTH_SECRET) throw new Error('Auth token is invalid when validating admin')

        console.log('admin validated successfully!')
        s.emit('auth', {
            isSuccess: true,
        })
    } catch (error) {
        console.error('Error in validateAdmin:', error)
        if (error instanceof Error) {
            console.error(error.message)
            s.emit('auth', {
                isSuccess: false,
                reason: error.message,
            })
        }
        s.disconnect()
    }
}
