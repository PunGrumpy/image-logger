const app = require('./server')
const logger = require('./logger')

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
  logger.info('Image logger started')
})
