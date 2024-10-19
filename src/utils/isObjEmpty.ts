/**
 * Check if an object is empty
 * @param obj - The object to check
 */
export const isObjEmpty = (obj: object | undefined | null) =>
  !obj ? true : Object.keys(obj).length === 0
