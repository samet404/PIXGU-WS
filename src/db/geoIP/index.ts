import type { MaxmindCity } from '@/types'
import maxmind from 'maxmind'

export const lookupCity = async (IP: string): Promise<MaxmindCity> => {
  const filePath = '/GeoLite2-City.mmdb'
  const city = await maxmind.open(filePath)
  const geoIP = city.get(IP) as MaxmindCity

  return geoIP
}
