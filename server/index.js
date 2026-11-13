/**
 * Guided Transfers server: Express for the API, Socket.IO for real-time
 * updates. The Vite dev server proxies /api and /socket.io here, so the
 * browser only ever talks to one origin.
 */
import { createServer } from 'node:http'
import express from 'express'
import { Server } from 'socket.io'
import { authenticate, selfView } from './auth.js'
import { db, load, reset } from './store.js'

const PORT = process.env.PORT || 3001

load()

const app = express()
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer)

/** Socket room that receives everything meant for one user. */
export const userRoom = (userId) => `user:${userId}`

// Sockets identify themselves the same way as HTTP requests do.
io.use((socket, next) => {
  const user = db.users[socket.handshake.auth?.userId]
  if (!user) return next(new Error('Unknown user.'))
  socket.data.userId = user.id
  next()
})

io.on('connection', (socket) => {
  socket.join(userRoom(socket.data.userId))
})

app.get('/api/health', (req, res) => res.json({ ok: true }))

// Demo only: used by `npm run reset` to reload a running server.
app.post('/api/dev/reset', (req, res) => {
  reset()
  io.emit('reset')
  res.json({ ok: true })
})

app.get('/api/me', authenticate, (req, res) => res.json(selfView(req.user)))

httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`)
})
