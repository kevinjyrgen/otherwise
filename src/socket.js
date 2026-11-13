import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

/**
 * Opens a Socket.IO connection as the given user and closes it on unmount.
 * @param {string} userId
 * @returns {{socket: import('socket.io-client').Socket|null, connected: boolean}}
 */
export function useSocket(userId) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    // No URL: connects to the page's own origin, which Vite proxies to the server.
    const connection = io({ auth: { userId } })
    connection.on('connect', () => setConnected(true))
    connection.on('disconnect', () => setConnected(false))
    setSocket(connection)
    return () => connection.close()
  }, [userId])

  return { socket, connected }
}
