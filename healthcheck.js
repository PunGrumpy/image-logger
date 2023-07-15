const http = require('http')
const config = require('./src/config.json')
const logger = require('./src/logger')

const PORT = process.env.PORT || 8080

const healthCheckServer = http.createServer((req, res) => {
  const userAgent = req.headers['user-agent'] || 'not found'

  if (
    userAgent.includes(
      process.env.HEALTHCHECK_USER_AGENT || config.healthcheck.userAgent
    )
  ) {
    try {
      const health = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        status: 200
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(health))

      logger.info('Health check OK')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Internal Server Error'
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: errorMessage }))
    }
  } else {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Service Unavailable' }))
  }
})

healthCheckServer.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  healthCheckServer.close(() => {
    console.log('Health check server closed')
    process.exit(0)
  })
})
