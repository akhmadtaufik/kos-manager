import { logger } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.startTime = Date.now()
    
    logger.info({
      reqId: event.context.reqId,
      req: {
        method: event.method,
        url: event.path,
      },
    }, `[${event.context.reqId}] Incoming request: ${event.method} ${event.path}`)
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const duration = Date.now() - (event.context.startTime || Date.now())
    const statusCode = event.node.res.statusCode
    
    logger.info({
      reqId: event.context.reqId,
      res: {
        statusCode,
        durationMs: duration,
      },
    }, `[${event.context.reqId}] Request completed: ${event.method} ${event.path} - ${statusCode} (${duration}ms)`)
  })
})
