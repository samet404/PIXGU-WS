import type { SocketAll } from '../types'

export const getCookies = (s: SocketAll) => {
  const cookies = s.handshake.headers.cookie
  if (!cookies) s.disconnect()

  return cookies!.split(';').reduce((acc: Record<string, string>, pair) => {
    const [key, value] = pair.split('=')
    acc[key as keyof typeof acc] = value
    return acc
  }, {})
}
