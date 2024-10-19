import type { Socket } from 'socket.io'
import type { OverrideProps } from '.'
import type { Session, User } from 'lucia'
import type { Guest } from './guest'

export type NotJoinedSocket = OverrideProps<
  Socket,
  {
    data: {
      isLogged: false
    }
  }
>

export type LoggedSocket = OverrideProps<
  Socket,
  {
    data: {
      isLogged: true
      userID: string
      user: User
      session: Session
    }
  }
>

export type GuestSocket = OverrideProps<
  Socket,
  {
    data: {
      isLogged: false
      isGuest: true
      guestID: string
      guest: Guest
    }
  }
>

export type GuestPlayerSocket = OverrideProps<
  Socket,
  {
    data: {
      isPlayer: true
      roomID: string
    } & GuestSocket['data']
  }
>

export type LoggedPlayerSocket = OverrideProps<
  Socket,
  {
    data: {
      isPlayer: true
      roomID: string
    } & LoggedSocket['data']
  }
>

export type SocketAll = LoggedSocket | Socket | GuestSocket
