const fs = require('fs')
const path = require('path')
const axios = require('axios')
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
        <script>
          setTimeout(function() {
            window.location.href = '/fileToSend';
          }, 2000); // Redirect after 2 seconds (adjust the delay as needed)

          setTimeout(function() {
            alert('Open file.txt to see the magic');
          }, 3000); // Alert after 1 second (adjust the delay as needed)
        </script>
      </body>
    </html>
  `)
})

app.get('/fileToSend', (req, res) => {
  try {
    const fileToSendPath = path.join(__dirname, 'assets', 'file.txt')

    res.setHeader('Content-Disposition', 'inline; filename=file.txt')
    res.setHeader('Content-Type', 'text/plain')

    res.download(fileToSendPath, 'file.txt', err => {
      if (err) {
        logger.error(`Error sending file to client: ${err}`)
        res.status(500).json({ message: 'Internal Server Error' })
      } else {
        logger.info(`File sent to client ${req.ip}`)
      }
    })
  } catch (error) {
    logger.error(`Error reading file: ${error}`)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

app.get('/img/:imageName', async (req, res) => {
  const { imageName } = req.params
  const image = config.images.find(img => img.name === imageName)

  if (!image) {
    return res.status(404).json({ message: 'Image not found' })
  }

  const imagePath = image.path
  const imageNameWithExtension = `${image.name}.${image.path.split('.').pop()}`
  const imagePathOnServer = path.join(
    __dirname,
    'assets',
    imageNameWithExtension
  )

  if (!fs.existsSync(path.join(__dirname, 'assets', imageNameWithExtension))) {
    fs.mkdirSync(path.join(__dirname, 'assets'), { recursive: true })

    if (image.path.startsWith('http')) {
      try {
        const response = await axios.get(image.path, { responseType: 'stream' })
        const writeStream = fs.createWriteStream(imagePathOnServer)
        response.data.pipe(writeStream)

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })

        logger.info(`Image ${imageNameWithExtension} saved`)
      } catch (error) {
        logger.error(`Error fetching or saving image: ${error}`)
        return res
          .status(500)
          .json({ message: 'Error fetching or saving image' })
      }
    }
  }

  logger.info(`Image requested: ${imagePath}`)

  res.sendFile(
    imagePathOnServer,
    { headers: { 'Content-Type': 'image/png' } },
    error => {
      if (error) {
        logger.error(`Error sending image: ${error}`)
      } else {
        logger.info(`Image ${imageNameWithExtension} sent to the client`)
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
    const domain = `${req.protocol}://${req.get('host')}${req.originalUrl}`

    await ipInfo(
      clientIP,
      imageNameWithExtension,
      imagePath,
      os,
      browser,
      userAgent,
      domain
    )
  } catch (error) {
    logger.error(`Error getting client's IP: ${error}`)
  }
})

app.use('/img', express.static('img'))

app.get('/stats', (req, res) => {
  const totalImages = config.images.length
  const imagesList = config.images
    .map(
      image =>
        `<li><a href="/img/${image.name}"><img src="/img/${image.name}" width="200" height="200" /></a><p>${image.name}</p></li>`
    )
    .join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Status | Image Logger</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
        />
        <style>
          body {
            background-color: #333;
            color: #fff;
            margin: 0;
          }
          h1 {
            font-size: 36px;
            margin-bottom: 20px;
          }
          .slider-container {
            overflow: hidden;
          }
          .slider-wrapper {
            display: flex;
            transition: transform 0.3s ease-in-out;
          }
          li {
            margin: 10px;
            text-align: center;
            align-items: center;
          }
          img {
            margin-right: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }
          p {
            margin: 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
          <div>
            <h1 class="display-4 text-center mb-4">Status</h1>
            <p class="lead">Total images: ${totalImages}</p>
            <div class="slider-container">
              <div class="slider-wrapper" id="slider">
                <ul class="list-inline" id="imagesList">${imagesList}</ul>
              </div>
            </div>
          </div>
        </div>
        <script>
          const imagesList = document.getElementById('imagesList');
          const totalImagesElement = document.getElementById('totalImages');
          const configImages = ${JSON.stringify(
            config.images
          )}; // JSON representation of your config.images array

          const showImages = (startIdx) => {
            const pageSize = 4; // Number of images per slide
            const endIndex = Math.min(startIdx + pageSize, configImages.length);
            imagesList.innerHTML = '';

            for (let i = startIdx; i < endIndex; i++) {
              const image = configImages[i];
              const listItem = document.createElement('li');
              listItem.innerHTML = \`<a href="/img/\${image.name}"><img src="/img/\${image.name}" width="200" height="200" /></a><p>\${image.name}</p>\`;
              imagesList.appendChild(listItem);
            }

            totalImagesElement.textContent = configImages.length;
          };

          let currentIndex = 0;
          showImages(currentIndex);

          setInterval(() => {
            currentIndex = (currentIndex + 1) % configImages.length;
            showImages(currentIndex);
          }, 5000); // Change slide every 5 seconds (adjust the interval as needed)
        </script>
      </body>
    </html>
  `

  res.send(htmlContent)
})

app.get('/health', (req, res) => {
  const userAgent = req.headers['user-agent'] || 'not found'

  if (
    userAgent.includes(
      process.env.HEALTHCHECK_USER_AGENT || 'image-logger-by-pungrumpy'
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

      logger.info(
        `Health check response: ${JSON.stringify(
          health
        )} with user agent: ${userAgent}`
      )
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

module.exports = app
