import type { Socket } from 'socket.io'
import type {
  GuestSocket,
  LoggedSocket,
  NotJoinedSocket,
  SocketAll,
} from '@/types'
import { emitIO } from '@/utils'
import { validateUser } from '@/lucia'
import { validateGuest } from '../auth/guest'
import { z } from 'zod'

export const onAuth = (s: Socket, cbs: Cbs) => {
  const auth = async () => {
    console.log('Authenticating user...')
    let isLogged = false
    let isGuest = false
    const failed: (keyof Cbs)[] = []

    if (cbs.logged) {
      const logged = await validateUser(s)
      console.log(logged)
      if (logged) {
        const { user, session } = logged
        isLogged = true
        s.data.isLogged = true
        s.data.isGuest = false
        s.data.userID = user.id
        s.data.user = user
        s.data.session = session
        s.join(user.id)
        cbs.logged(s)
        cbs.default?.(s)
        emitIO.output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'logged',
        })
        return
      } else failed.push('logged')
    }

    if (cbs.guest) {
      const guest = await validateGuest(s)
      console.log(guest)

      if (guest) {
        isGuest = true
        s.data.isLogged = false
        s.data.isGuest = true
        s.data.guestID = guest.ID
        s.data.guest = guest
        s.join(guest.ID)
        cbs.guest(s)
        cbs.default?.(s)
        emitIO.output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'guest',
        })
        return
      } else failed.push('guest')
    }

    if (cbs.notJoined) {
      console.log('notJoined')
      if (cbs.logged && !isLogged) {
        s.data.isLogged = false
        s.data.isGuest = true
        cbs.notJoined(s)
        cbs.default?.(s)
        emitIO.output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'notJoined',
        })
        return
      }

      console.log('notJoined1')
      if (cbs.guest && !isGuest) {
        s.data.isLogged = false
        s.data.isGuest = true
        cbs.notJoined(s)
        cbs.default?.(s)
        emitIO.output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'notJoined',
        })
        return
      }

      console.log('notJoined3')
      const user = await validateUser(s)
      const guest = await validateGuest(s)

      if (!user && !guest) {
        s.data.isLogged = false
        s.data.isGuest = true
        cbs.notJoined(s)
        cbs.default?.(s)
        emitIO.output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'notJoined',
        })
        return
      } else failed.push('notJoined')
    }

    emitIO.output(z.any()).emit(s, 'auth', {
      isSuccess: false,
      required: failed,
    })
    console.log('failed auth: ', failed)
  }

  s.once('auth', auth)
}

type Cbs = {
  logged?: (s: LoggedSocket) => void
  notJoined?: (s: NotJoinedSocket) => void
  guest?: (s: GuestSocket) => void
  default?: (s: SocketAll) => void
}
