/**
 * Guided Transfers server: Express for the API, Socket.IO for real-time
 * updates. The Vite dev server proxies /api and /socket.io here, so the
 * browser only ever talks to one origin.
 */
import { createApp } from './app.js'
import { load } from './store.js'

const PORT = process.env.PORT || 3001

load()

createApp().httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
  console.log('[server] payments and exchange rates are MOCKED. No real money moves.')
})
