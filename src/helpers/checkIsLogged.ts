import type { Socket } from 'socket.io'
import { lucia } from '@/lucia'

export const checkIsLogged = async (socket: Socket): Promise<boolean> => {
  const AUTH_SESSION_COOKIE_NAME = 'auth_session'

  const cookiesStr = socket.handshake.headers.cookie
  if (!cookiesStr) {
    socket.data.isLogged = false
    return false
  }

  const cookies = cookiesStr!
    .split(';')
    .reduce((acc: Record<string, string>, pair) => {
      const [key, value] = pair.split('=')
      acc[key as keyof typeof acc] = value
      return acc
    }, {})

  const sessionId = cookies[AUTH_SESSION_COOKIE_NAME]
  if (!sessionId) {
    socket.data.isLogged = false
    return false
  }

  const authInfo = await lucia.validateSession(sessionId!)
  console.log('authInfo: ', authInfo)
  if (!authInfo) {
    socket.data.isLogged = false
    return false
  }

  const user = authInfo.user
  if (!user) {
    socket.data.isLogged = false
    return false
  }

  const session = authInfo.session
  if (!session) {
    socket.data.isLogged = false
    return false
  }

  socket.data.isLogged = true
  socket.data.userID = user.id
  socket.data.user = user
  socket.data.session = authInfo.session

  return true
}
