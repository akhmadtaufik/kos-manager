import { sendSuccessResponse } from '../../utils/response'

export default defineEventHandler((event) => {
  const paginatedData = {
    data: [],
    meta: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0
    }
  }
  return sendSuccessResponse(event, paginatedData, 200, 'Pagination retrieved successfully')
})
