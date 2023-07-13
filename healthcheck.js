const http = require('http')

const healthCheckServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Health check OK')
})

const PORT = process.env.PORT || 8080

healthCheckServer.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`)
})
