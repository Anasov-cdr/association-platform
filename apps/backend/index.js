import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '.env'), override: true })

import('./src/server.js').catch((error) => {
  console.error('[startup] Failed to start backend:', error)
  process.exit(1)
})
