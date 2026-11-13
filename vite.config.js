import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// API + Socket.IO server (see /server). Proxied so phones on the same Wi-Fi
// only need the one Vite URL. SERVER_URL overrides it, e.g. to try things
// against a second server without touching the demo one.
const SERVER = process.env.SERVER_URL || 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      '/api': SERVER,
      '/socket.io': { target: SERVER, ws: true },
    },
  },
})
