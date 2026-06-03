import './instrument.js'
import app from './app.js'
import { config } from './config/index.js'
import { logger } from './lib/logger.js'

const PORT = config.server.port

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started')
})
