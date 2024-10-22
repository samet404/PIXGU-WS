/**
 * Type that represents an object with at least one property
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U]
