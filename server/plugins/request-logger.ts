import { logger } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.startTime = Date.now()
    
    logger.info({
      req: {
        method: event.method,
        url: event.path,
      },
    }, `Incoming request: ${event.method} ${event.path}`)
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const duration = Date.now() - (event.context.startTime || Date.now())
    const statusCode = event.node.res.statusCode
    
    logger.info({
      res: {
        statusCode,
        durationMs: duration,
      },
    }, `Request completed: ${event.method} ${event.path} - ${statusCode} (${duration}ms)`)
  })
})
