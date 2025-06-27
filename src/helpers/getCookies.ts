import type { Socket } from 'socket.io'

export const getCookies = (s: Socket) => {
  const cookies = s.handshake.headers.cookie
  if (!cookies) {
    s.disconnect()
    return
  }

  return cookies!.split(';').reduce((acc: Record<string, string>, pair) => {
    const [key, value] = pair.trim().split('=')
    acc[key.trim() as keyof typeof acc] = value.trim()
    return acc
  }, {})
}
