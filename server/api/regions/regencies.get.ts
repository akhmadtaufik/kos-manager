import { getKemendagriRegencies } from '../../utils/kemendagri'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Regions'],
    summary: 'Get Indonesian Regencies and Cities (Kemendagri Standard)',
    description: 'Retrieves regencies and cities, strictly differentiating between KOTA and KABUPATEN.'
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const provinceId = query.provinceId as string | undefined

  const regencies = getKemendagriRegencies(provinceId)
  return apiSuccess(regencies, 'Regencies retrieved successfully')
})
