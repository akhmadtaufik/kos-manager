import { getKemendagriRegencies } from '../../utils/kemendagri'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Regions'],
    summary: 'Get Indonesian Regencies and Cities (Kemendagri Standard)',
    description: 'Retrieves regencies and cities mapped strictly according to official Kemendagri standards, differentiating between KOTA and KABUPATEN.',
    parameters: [
      {
        name: 'provinceId',
        in: 'query',
        required: false,
        schema: { type: 'string', example: '31' },
        description: '2-digit Kemendagri province ID (e.g., 31 for DKI Jakarta, 32 for Jawa Barat). Also accepts snake_case province_id.'
      }
    ],
    responses: {
      200: {
        description: 'List of regencies and cities retrieved successfully.'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const provinceId = (query.provinceId || query.province_id) as string | undefined

  const regencies = getKemendagriRegencies(provinceId)
  return apiSuccess(regencies, 'Regencies retrieved successfully')
})
