import { io } from '@/io'
import { onConnection } from '@/helpers'
import { emitIO, onIO } from '@/utils'
import { z } from 'zod'

export const test = () => {
  const testIO = io.of('/test')

  onConnection(testIO, (s) => {
    console.log('connected to the test')
    s.join('dsapdjasopdsajop')
    emitIO
      .output(z.any())
      .emit(io.of('/test').to('dsapdjasopdsajop'), 'test', 'hello world')
  })
}
