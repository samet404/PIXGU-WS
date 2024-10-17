import type { MaxmindCity } from '@/types'
import { pathFromRoot } from '@/utils'

export const lookupCity = async (IP: string): Promise<MaxmindCity> => {
  const maxmind = await import('maxmind')
  const filePath = new Error().stack[0] + '/GeoLite2-City.mmdb'
  const city = await maxmind.open(filePath)
  const geoIP = city.get(IP) as MaxmindCity

  return geoIP
}
