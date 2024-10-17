import type { Namespace, Server, Socket } from 'socket.io'
import type { OverrideProps } from '.'
import type { Session, User } from 'lucia'

export type NotLoggedSocket = OverrideProps<
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

export type SocketAll =
  | LoggedSocket
  | NotLoggedSocket
  | Socket
  | Server
  | Namespace
