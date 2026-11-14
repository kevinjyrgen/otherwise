/**
 * Guided Transfers server: Express for the API, Socket.IO for real-time
 * updates. The Vite dev server proxies /api and /socket.io here, so the
 * browser only ever talks to one origin.
 */
import { createApp } from './app.js'
import { catchUp } from './schedules.js'
import { load } from './store.js'

const PORT = process.env.PORT || 3001

load()

// Regular payments: handle the days that passed while the server was off,
// then look again every minute so a new day is noticed.
catchUp()
setInterval(catchUp, 60_000)

createApp().httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
  console.log('[server] payments and exchange rates are MOCKED. No real money moves.')
})
