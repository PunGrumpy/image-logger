const fs = require('fs')
const path = require('path')
const request = require('request')
const express = require('express')
const ipInfo = require('./ipInfo')
const logger = require('./logger')
const { v4: uuidv4 } = require('uuid')
const UAParser = require('ua-parser-js')
const bodyParser = require('body-parser')

const config = require('./config.json')

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
    const imageUrl = image.path

    logger.info(`Image requested: ${imageUrl}`)

    res.setHeader('Content-Type', 'image/png')

    request
      .get(imageUrl)
      .on('error', error => {
        logger.error(`Error fetching image: ${error}`)
        res.status(500).json({ message: 'Error fetching image' })
      })
      .pipe(res)

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
      const domain = `${req.protocol}://${req.get('host')}${req.originalUrl}`

      ipInfo(clientIP, imageName, imageUrl, os, browser, userAgent, domain)
    } catch (error) {
      logger.error(`Error getting client's IP: ${error}`)
    }
  } else {
    res.status(404).json({ message: 'Image not found' })
  }
})

app.post('/image', (req, res) => {
  const { image, imageName } = req.body

  if (image) {
    const finalImageName = imageName || uuidv4()
    const imagePath = path.join(__dirname, 'assets', `${finalImageName}.png`)

    fs.mkdirSync(path.join(__dirname, 'assets'), { recursive: true })

    if (fs.existsSync(imagePath)) {
      return res.status(400).json({ message: 'Image name already exists' })
    }

    request
      .get(image)
      .on('error', error => {
        logger.error(`Error fetching image: ${error}`)
        res.status(500).json({ message: 'Error fetching image' })
      })
      .pipe(fs.createWriteStream(imagePath))
      .on('close', () => {
        logger.info(`Image ${finalImageName} saved`)
        res.status(200).json({ message: 'Image saved' })
      })
  } else {
    res.status(400).json({ message: 'No image provided' })
  }
})

module.exports = app
