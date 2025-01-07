import { flushStartsWith } from '../utils'

export const clearThemes = async () => {
    await flushStartsWith(['room_themes'])
}