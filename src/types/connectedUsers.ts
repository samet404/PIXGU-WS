import type { User } from 'lucia'

type ID = string
type NamespaceName = string

export type ConnectedUsers = Partial<
  Record<
    ID,
    {
      info: User
      connectons: {
        namespace: NamespaceName
      }[]
      totalConnections: number
      namespaceConnectionsNumber: Record<NamespaceName, number>
    }
  >
>

export type ConnectedUsersWithSocketID = Partial<
  Record<
    ID,
    {
      connectons: {
        namespace: NamespaceName
      }[]
      totalConnections: number
      namespaceConnectionsNumber: Record<NamespaceName, number>
    }
  >
>
