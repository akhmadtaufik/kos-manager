import { getKemendagriDistricts } from '../../utils/kemendagri'
import { apiSuccess } from '../../utils/response'

defineRouteMeta({
  openAPI: {
    tags: ['Regions'],
    summary: 'Get Indonesian Districts (Kecamatan - Kemendagri Standard)',
    description: 'Retrieves districts (kecamatan) mapped strictly according to official Kemendagri standards, filtered by regency/city ID.',
    parameters: [
      {
        name: 'regencyId',
        in: 'query',
        required: false,
        schema: { type: 'string', example: '3171' },
        description: '4-digit Kemendagri regency/city ID (e.g., 3171 for Kota Adm. Jakarta Pusat). Also accepts snake_case regency_id.'
      }
    ],
    responses: {
      200: {
        description: 'List of districts retrieved successfully.'
      }
    }
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const regencyId = (query.regencyId || query.regency_id) as string | undefined

  const districts = getKemendagriDistricts(regencyId)
  return apiSuccess(districts, 'Districts retrieved successfully')
})
