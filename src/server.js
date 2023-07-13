const express = require('express')
const ipInfo = require('./ipInfo')
const logger = require('./logger')
const { v4: uuidv4 } = require('uuid')
const UAParser = require('ua-parser-js')
const bodyParser = require('body-parser')
const { createCanvas } = require('canvas')

const config = require('./config.json')

const canvas = createCanvas(1920, 1080)
const ctx = canvas.getContext('2d')

ctx.fillStyle = 'rgba(0, 0, 0, 0)'
ctx.fillRect(0, 0, canvas.width, canvas.height)

const imageLogger = (imageData, imageName) => {
  loadImage(imageData)
    .then(image => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    })
    .catch(error => {
      logger.error(`Error loading image ${imageName}: ${error}`)
    })
}

const app = express()

app.enable('trust proxy')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Image Logger</title>
        <style>
          body {
            background-color: #222;
            color: #fff;
            padding: 20px;
            font-family: sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          h1 {
            font-size: 50px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>Why are you here?</h1>
        </div>
      </body>
    </html>
  `)
})

app.get('/image/:imageName', (req, res) => {
  const { imageName } = req.params
  const image = config.images.find(img => img.name === imageName)

  if (image) {
    const imageUrl = image.url
    const imageName = `${image.name}.png`

    logger.info(`Image requested: ${imageUrl}`)

    res.sendFile(
      imageUrl,
      { root: __dirname, headers: { 'Content-Type': 'image/png' } },
      error => {
        if (error) {
          logger.error(`Error sending image: ${error}`)
        } else {
          logger.info(`Image ${imageName} sent to the client`)
        }
      }
    )

    try {
      const clientIP =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        req.ip ||
        'not found'

      const userAgent = req.headers['user-agent'] || 'not found'
      const parser = new UAParser()
      const result = parser.setUA(userAgent).getResult()
      const os = result.os.name || 'not found'
      const browser = result.browser.name || 'not found'

      ipInfo(clientIP, imageName, imageUrl, os, browser, userAgent)
    } catch (error) {
      logger.error(`Error getting client's IP: ${error}`)
    }
  } else {
    res.status(404).json({ message: 'Image not found' })
  }
})

app.post('/upload', (req, res) => {
  const imageData = req.body
  const imageName = `${uuidv4()}.png`

  imageLogger(imageData, imageName)

  res.status(200).json({ message: 'Image uploaded' })
})

module.exports = app
