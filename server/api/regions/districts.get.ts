import { getKemendagriDistricts } from '../../utils/kemendagri'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Regions'],
    summary: 'Get Indonesian Districts (Kecamatan - Kemendagri Standard)',
    description: 'Retrieves districts (kecamatan) filtered by regency ID.'
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const regencyId = query.regencyId as string | undefined

  const districts = getKemendagriDistricts(regencyId)
  return apiSuccess(districts, 'Districts retrieved successfully')
})
