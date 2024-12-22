import { init } from '@paralleldrive/cuid2'

const createId = init({
    length: 40
})

const cuid = createId()

console.log(cuid)