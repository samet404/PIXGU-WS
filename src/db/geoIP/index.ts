import type { MaxmindCity } from '@/types'
import maxmind from 'maxmind'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const lookupCity = async (IP: string): Promise<MaxmindCity> => {
  const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
  const __dirname = path.dirname(__filename); // get the name of the directory

  const filePath = `${__dirname}/GeoLite2-City.mmdb`
  const city = await maxmind.open(filePath)
  const geoIP = city.get(IP) as MaxmindCity

  return geoIP
}
