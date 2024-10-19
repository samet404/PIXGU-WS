import { io } from '@/io'
import { onConnection } from '@/helpers'
import { emitIO, onIO } from '@/utils'
import { z } from 'zod'

export const test = () => {
  const testIO = io.of('/test')

  onConnection(testIO, (s) => {
    console.log('connected to the test')

    onIO.on(s, 'test', () => {
      console.log('received test')
      emitIO.output(z.any()).emit(s.to(s.id), 'test', 'hello world')
    })
  })
}
