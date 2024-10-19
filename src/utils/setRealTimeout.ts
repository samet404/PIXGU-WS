/**
 * Sets an timeout with interval to prevent event loop issues
 */
export const setRealTimeout = (
  cb: (passed: number) => void,
  timeoutMs: number,
  intervalMs: number = 100,
) => {
  const start = Date.now()
  const interval = setInterval(() => {
    const passed = Date.now() - start
    if (passed >= timeoutMs) {
      clearInterval(interval)
      cb(passed)
    }
  }, intervalMs)
}
