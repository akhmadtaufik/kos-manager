import { defineEventHandler, getHeader } from 'h3'
import { randomBytes } from 'crypto'

export default defineEventHandler((event) => {
  // Try to get from header first, otherwise generate
  const reqId = getHeader(event, 'x-correlation-id') || `REQ-${randomBytes(3).toString('hex').toUpperCase()}`
  event.context.reqId = reqId
})
