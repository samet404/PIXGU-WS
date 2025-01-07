import { lucia } from '@/lucia'
import { getCookies } from '@/helpers'
import type { AllSocketTypes } from '@/types'
import type { Session, User } from 'lucia'

export const validateUser = async (
  socket: AllSocketTypes,
): Promise<{ user: User; session: Session } | null> => {
  const cookies = getCookies(socket)
  if (!cookies) return null

  const sessionId = cookies['auth_session']
  if (!sessionId) return null

  const authInfo = await lucia.validateSession(sessionId!)
  if (!authInfo) return null

  const user = authInfo.user
  if (!user) return null

  const session = authInfo.session
  if (!session) return null

  return {
    user,
    session,
  }
}
