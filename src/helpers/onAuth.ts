import type { Socket } from 'socket.io'
import type { LoggedSocket, NotLoggedSocket } from '@/types'
import { emitIO } from '@/utils'
import { z } from 'zod'
import { checkIsLogged } from './checkIsLogged'

export const onAuth = (
  s: Socket,
  cbs: {
    both?: (s: LoggedSocket | NotLoggedSocket) => void
    logged?: (s: LoggedSocket) => void
    notLogged?: (s: NotLoggedSocket) => void
  },
) => {
  const auth = async () => {
    console.log('Authenticating user...')
    const isLogged = await checkIsLogged(s)

    if (!isLogged) {
      emitIO.output(z.boolean()).emit(s.to(s.id), 'is-logged', false)
      if (cbs.notLogged) cbs.notLogged(s)
    } else {
      const userID = s.data.userID

      s.join(userID)
      emitIO.output(z.boolean()).emit(s.to(s.id), 'is-logged', true)
      if (cbs.logged) cbs.logged(s)
    }

    if (cbs.both) cbs.both(s)
  }

  s.once('auth', auth)
}
