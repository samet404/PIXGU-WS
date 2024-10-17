import { env } from '../env'

/**
 * Middleware error
 */
export const mError = (arg: {
  message: string
  code:
    | 'UNAUTHORIZED'
    | 'BAD_REQUEST'
    | 'TOO_MANY_CONNECTIONS'
    | 'INTERNAL_SERVER_ERROR'
  noLog?: boolean
}) => {
  const err = new Error(arg.message)
  // @ts-ignore
  err.code = arg.code
  if (env.NODE_ENV !== 'production' && !arg.noLog) {
    console.error(err)
  }
  return err
}
