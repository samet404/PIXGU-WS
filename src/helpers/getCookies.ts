import type { SocketAll } from '../types'

export const getCookies = (s: SocketAll) => {
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
