/**
 * Runs all functions
 */
export const runAll = async (...fns: Function[]) => {
  for (const fn of fns) {
    await fn()
  }
}
