import type {
  AtLeastOne,
} from '@/types'
import type { Socket } from 'socket.io'
import { z } from 'zod'
import { emitIO } from 'utils/emitIO'
import { validateGuest } from 'auth/guest/validate'

/**
 * Authenticates a socket
 * @param s - socket
 * @param cbs - callback functions
 *
 * `beforeRes: callback will be called before the user receives the response and vice versa`
 *
 * @example
 * onAuth(s, {
 *   logged: {
 *     beforeRes: (s) => console.log('logged b'),
 *     afterRes: (s) => console.log('logged a'),
 *   },
 *   guest: {
 *     beforeRes: (s) => console.log('guest b'),
 *     afterRes: (s) => console.log('guest a'),
 *   },
 *
 * `In this example, if user is logged in, the "logged" callbacks will be called.`
 */
export const onAuth = (s: Socket, cbs: Cbs) => {
  const auth = async () => {
    console.log('Authenticating user...', {
      handshake: s.handshake,
    })
    let isLogged = false
    let isGuest = false
    const failed: (keyof Cbs)[] = []

    if (cbs.logged) {
      console.log('validating is logged')
      // const logged = await validateUser(s)

      // if (logged) {
      //   const { user, session } = logged
      //   isLogged = true
      //   s.data.isLogged = true
      //   s.data.isGuest = false
      //   s.data.userID = user.id
      //   s.data.user = user
      //   s.data.session = session
      //   s.join(user.id)
      //   cbs.logged.beforeRes?.(s)
      //   cbs.default?.beforeRes?.(s)
      //   emitIO().output(z.any()).emit(s, 'auth', {
      //     isSuccess: true,
      //     as: 'logged',
      //   })
      //   cbs.logged.afterRes?.(s)
      //   cbs.default?.afterRes?.(s)
      //   return
      // }
      // else
      failed.push('logged')
    }

    if (cbs.guest) {
      console.log('validating is guest')
      const guest = await validateGuest(s)
      console.log(guest)

      if (guest) {
        isGuest = true
        s.data.isLogged = false
        s.data.isGuest = true
        s.data.guestID = guest.ID
        s.data.guest = guest
        s.join(guest.ID)
        cbs.guest.beforeRes?.(s)
        cbs.default?.beforeRes?.(s)
        emitIO().output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'guest',
        })
        cbs.guest.afterRes?.(s)
        cbs.default?.afterRes?.(s)
        return
      } else failed.push('guest')
    }

    if (cbs.notJoined) {
      console.log('notJoined')
      if (cbs.logged && !isLogged) {
        s.data.isLogged = false
        s.data.isGuest = true
        cbs.notJoined.beforeRes?.(s)
        cbs.default?.beforeRes?.(s)
        emitIO().output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'notJoined',
        })
        cbs.notJoined.afterRes?.(s)
        cbs.default?.afterRes?.(s)
        return
      }

      console.log('notJoined1')
      if (cbs.guest && !isGuest) {
        s.data.isLogged = false
        s.data.isGuest = true
        cbs.notJoined.beforeRes?.(s)
        cbs.default?.beforeRes?.(s)
        emitIO().output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'notJoined',
        })
        cbs.notJoined.afterRes?.(s)
        cbs.default?.afterRes?.(s)
        return
      }

      const guest = await validateGuest(s)

      if (
        // !user  &&
        !guest
      ) {
        s.data.isLogged = false
        s.data.isGuest = true
        cbs.notJoined.beforeRes?.(s)
        cbs.default?.beforeRes?.(s)
        emitIO().output(z.any()).emit(s, 'auth', {
          isSuccess: true,
          as: 'notJoined',
        })
        cbs.notJoined.afterRes?.(s)
        cbs.default?.afterRes?.(s)
        return
      } else failed.push('notJoined')
    }

    emitIO().output(z.any()).emit(s, 'auth', {
      isSuccess: false,
      required: failed,
    })
    console.log('failed auth: ', failed)
  }

  s.once('auth', auth)
}

type Cbs = {
  logged?: AtLeastOne<{
    beforeRes: (s: Socket) => void
    afterRes: (s: Socket) => void
  }>

  notJoined?: AtLeastOne<{
    beforeRes: (s: Socket) => void
    afterRes: (s: Socket) => void
  }>

  guest?: AtLeastOne<{
    beforeRes: (s: Socket) => void
    afterRes: (s: Socket) => void
  }>
  default?: AtLeastOne<{
    beforeRes: (s: Socket) => void
    afterRes: (s: Socket) => void
  }>
}
