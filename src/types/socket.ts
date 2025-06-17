import type { Guest } from './guest'
import type { OverrideProps } from './overrideProps'
import type { Socket } from 'socket.io'
import type { Contains } from './contains'

export type NotLoggedSocketData = {
  isLogged: false
}

export type LoggedSocketData = {
  isLogged: true
  userID: string
  isGuest: false
}

export type GuestSocketData = {
  isLogged: false
  isGuest: true
  guestID: string
  guest: Guest
}

export type GuestPlayerSocket = {
  isPlayer: true
  roomID: string
}

export type IsJoinedSocketData<T extends AllSocketData> = Contains<
  GuestSocketData | LoggedSocketData,
  T
>
export type IsJoinedSocket<T extends AllSocketTypes> = Contains<
  GuestSocketData | LoggedSocketData,
  T['data']
>

export type JoinedSocket = OverrideProps<
  Socket,
  {
    data: (LoggedSocketData | GuestSocketData) & {
      isPlayer: boolean
      roomID: string
    }
  }
>

export type LoggedPlayerSocket = {
  isPlayer: true
  roomID: string
}

export type AllSocketTypes = OverrideProps<
  Socket,
  {
    data: any
  }
>

export type IsSocket<T extends any> =
  OverrideProps<
    Socket,
    {
      data: any
    }
  > extends OverrideProps<
    T,
    {
      data: any
    }
  >
    ? true
    : never

export type AllSocketData = LoggedSocketData | GuestSocketData

export type HostSocket<T extends AllSocketData> = OverrideProps<
  Socket,
  {
    data: T & {
      isHost: true
      roomID: string
    }
  }
>

export type SocketWithoutData = OverrideProps<
  Socket,
  {
    data: any
  }
>
