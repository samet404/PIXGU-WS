/**
 * Runs all functions in parallel
 */
export const runAll = async (...fns: Function[]) => {
  for (const fn of fns) {
    await fn()
  }
}
