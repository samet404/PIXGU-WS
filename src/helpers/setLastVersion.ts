import { VERSION } from '../constants';
import { redisDb } from '../db/redis';

export const setLastVersion = async () => {
    try {
        console.log('SETTING LAST VERSION')
        await redisDb.set('last_version', VERSION)
    } catch (error) {
        console.error('Error in setLastVersion:', error)
    }
}
