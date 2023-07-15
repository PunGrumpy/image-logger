const app = require('./server')
const logger = require('./logger')

const port = process.env.PORT || 3000

app.listen(port, () => {
  const banner = `
██╗███╗   ███╗ █████╗  ██████╗ ███████╗    ██╗      ██████╗  ██████╗  ██████╗ ███████╗██████╗ 
██║████╗ ████║██╔══██╗██╔════╝ ██╔════╝    ██║     ██╔═══██╗██╔════╝ ██╔════╝ ██╔════╝██╔══██╗
██║██╔████╔██║███████║██║  ███╗█████╗      ██║     ██║   ██║██║  ███╗██║  ███╗█████╗  ██████╔╝
██║██║╚██╔╝██║██╔══██║██║   ██║██╔══╝      ██║     ██║   ██║██║   ██║██║   ██║██╔══╝  ██╔══██╗
██║██║ ╚═╝ ██║██║  ██║╚██████╔╝███████╗    ███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████╗██║  ██║
╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝`

  process.platform === 'linux' || process.platform === 'darwin'
    ? process.stdout.write(`\x1Bc\n\n${banner}\n\n`)
    : process.stdout.write(`\x1B[2J\x1B[3J\x1B[H\n\n${banner}\n\n`)

  console.log(`Server started on port ${port}`)
  logger.info('Image logger started')
})
