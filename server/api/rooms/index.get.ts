import { getRooms } from '../../services/room.service'
import { getUserProperties } from '../../services/property.service'
import { requirePropertyPermission } from '../../utils/rbac'
import { apiSuccess } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const propertyId = query.propertyId as string
  const user = event.context.user

  let targetPropertyIds: string[] = []

  if (propertyId && propertyId !== 'null' && propertyId !== 'undefined') {
    await requirePropertyPermission(user, propertyId)
    targetPropertyIds = [propertyId]
  } else {
    const props = await getUserProperties(user)
    targetPropertyIds = props.map(p => p.id)
  }

  const roomsData = await getRooms(targetPropertyIds)
  
  return apiSuccess(roomsData, 'Rooms retrieved successfully')
})
