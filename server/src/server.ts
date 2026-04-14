import app from './app.js'
import { config } from './config/index.js'

const PORT = config.server.port

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
