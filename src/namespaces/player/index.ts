import { io } from '@/io'
import { onAuth, onConnection } from '@/helpers'
import { authorizedPlayer } from './authorizedPlayer'

export const playerIO = io.of(`/p`)

export const player = () => {
  onConnection(playerIO, (s) => {
    onAuth(s, {
      guest: (s) => authorizedPlayer(s),
      logged: (s) => authorizedPlayer(s),
    })
  })
}
