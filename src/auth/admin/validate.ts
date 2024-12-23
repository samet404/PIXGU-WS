import type { AllSocketTypes } from '@/src/types'
import { z } from 'zod'

export const validateAdmin = (s: AllSocketTypes) => {
    try {
        console.log('admin validating...')

        const authToken = s.handshake.auth.token
        if (!authToken) throw new Error('No authToken')

        z.string().length(40).cuid2().parse(authToken)
        if (authToken !== 'k3wzeu2cfwvp3r1ojjmwy17e6fme8l8cc9t059fe') throw new Error('l6e7d60a4ejsg1hebzbmsw32ex1tk1b9gk55x9l5')

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
