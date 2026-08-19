import { getKemendagriProvinces } from '../../utils/kemendagri'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Regions'],
    summary: 'Get Indonesian Provinces (Kemendagri Standard)',
    description: 'Retrieves a static list of Indonesian provinces complying with Kemendagri standards.'
  }
})

export default defineEventHandler(async () => {
  const provinces = getKemendagriProvinces()
  return apiSuccess(provinces, 'Provinces retrieved successfully')
})
