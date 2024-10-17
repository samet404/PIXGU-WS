import { io } from '@/src'
import { onConnection } from '@/helpers'
import { emitIO, onIO } from '@/utils'

export const test = () => {
  const testIO = io.of('/test')

  onConnection(testIO, (s) => {
    console.log('connected to the test')

    onIO.on(s, 'test', () => {
      console.log('received test')
      emitIO.emit(s.to(s.id), 'test', 'hello world')
    })
  })
}
