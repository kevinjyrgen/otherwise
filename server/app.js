/**
 * Builds the Express app and the Socket.IO server without starting them, so
 * tests can run the same app on a random port.
 */
import { createServer } from 'node:http'
import express from 'express'
import { Server } from 'socket.io'
import { authenticate, requireRole, selfView } from './auth.js'
import { attach, emitAll, userRoom } from './events.js'
import helperRoutes from './routes/helper.js'
import ownerRoutes from './routes/owner.js'
import { advance, clockView } from './schedules.js'
import { db, reset, save } from './store.js'
import { RuleError } from './errors.js'

/** @returns {{app: import('express').Express, httpServer: import('node:http').Server}} */
export function createApp() {
  const app = express()
  // Roomy enough for a photo of a bill (the app shrinks it before sending).
  app.use(express.json({ limit: '8mb' }))

  const httpServer = createServer(app)
  const io = new Server(httpServer)
  attach(io)

  // Sockets identify themselves the same way as HTTP requests do.
  io.use((socket, next) => {
    const user = db.users[socket.handshake.auth?.userId]
    if (!user) return next(new Error('Unknown user.'))
    socket.data.userId = user.id
    next()
  })
  io.on('connection', (socket) => socket.join(userRoom(socket.data.userId)))

  app.get('/api/health', (req, res) => res.json({ ok: true }))

  // Demo only: used by `npm run reset` and the two reset buttons on /demo.
  // scenario "no-helper" starts without a helper; anything else has Mari active.
  app.post('/api/dev/reset', (req, res) => {
    reset({ withHelper: req.body?.scenario !== 'no-helper' })
    emitAll('reset')
    res.json({ ok: true })
  })

  // Demo only: the calendar that regular payments run on, for the /demo page.
  app.get('/api/dev/clock', (req, res) => res.json(clockView()))

  // Demo only: moves that calendar ahead so a regular payment can be shown.
  // to "reminder" = the day before the next regular payment; anything else = one day on.
  app.post('/api/dev/advance', async (req, res) => {
    const clock = await advance(req.body?.to)
    emitAll('changed')
    res.json(clock)
  })

  // Everything below needs a known user.
  app.use('/api', authenticate)

  app.get('/api/me', (req, res) => res.json(selfView(req.user)))

  app.get('/api/notifications', (req, res) =>
    res.json(
      db.notifications
        .filter((n) => n.userId === req.user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  )

  app.post('/api/notifications/read', (req, res) => {
    db.notifications.filter((n) => n.userId === req.user.id).forEach((n) => (n.read = true))
    save()
    res.json({ ok: true })
  })

  app.use('/api/owner', requireRole('owner'), ownerRoutes)
  app.use('/api/helper', requireRole('helper'), helperRoutes)

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }))

  // Rule violations become their own status code; anything else is a 500.
  // Express needs all four arguments to treat this as an error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof RuleError) return res.status(error.status).json({ error: error.message })
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'This photo is too big. Please try again.' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  })

  return { app, httpServer }
}
