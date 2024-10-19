import { onAuth, onConnection } from '@/helpers'
import { io } from '@/io'
import { authorizedHost } from './funcs'

export const hostIO = io.of(`/h`)

export const host = () => {
  onConnection(hostIO, (s) => {
    console.log('onConnection host')
    onAuth(s, {
      logged: (s) => authorizedHost(s),
      guest: (s) => authorizedHost(s),
    })
  })
}
