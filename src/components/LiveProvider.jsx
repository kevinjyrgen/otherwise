import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, USER_ID } from '../api.js'
import { LiveContext } from '../live.js'
import { useSocket } from '../socket.js'
import { notificationText } from './notifications.strings.js'

/** Shows a system notification, but only if the person allowed it and the tab is hidden. */
function browserNotify(role, notification) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return
  new Notification(notificationText(role, notification))
}

/**
 * Loads everything one role needs and keeps it fresh: any change on the
 * server arrives as a socket event and triggers a refetch.
 * @param {{role: 'owner'|'helper', children: React.ReactNode}} props
 */
export default function LiveProvider({ role, children }) {
  const userId = USER_ID[role]
  const { socket, connected } = useSocket(userId)
  const [data, setData] = useState(null)
  const [toast, setToast] = useState(null)

  const call = useCallback((path, options) => api(userId, path, options), [userId])

  const refresh = useCallback(async () => {
    const [me, transfers, notifications] = await Promise.all([
      call('/me'),
      call(`/${role}/transfers`),
      call('/notifications'),
    ])
    setData({ me, transfers, notifications })
  }, [call, role])

  /** Calls the API, then refetches so the screen shows the result at once. */
  const send = useCallback(
    async (path, body, method = 'POST') => {
      const result = await call(path, { method, body })
      await refresh()
      return result
    },
    [call, refresh],
  )

  useEffect(() => {
    refresh().catch(console.error)
  }, [refresh])

  useEffect(() => {
    if (!socket) return
    const onChange = () => refresh().catch(console.error)
    const onNotification = (notification) => {
      setToast(notification)
      browserNotify(role, notification)
      onChange()
    }
    socket.on('connect', onChange)
    socket.on('changed', onChange)
    socket.on('reset', onChange)
    socket.on('notification', onNotification)
    return () => {
      socket.off('connect', onChange)
      socket.off('changed', onChange)
      socket.off('reset', onChange)
      socket.off('notification', onNotification)
    }
  }, [socket, refresh, role])

  const dismissToast = useCallback(() => setToast(null), [])

  const value = useMemo(
    () => ({ role, ...data, connected, toast, dismissToast, call, send }),
    [role, data, connected, toast, dismissToast, call, send],
  )

  return (
    <LiveContext.Provider value={value}>
      {data ? children : <div className="min-h-svh bg-ink" />}
    </LiveContext.Provider>
  )
}
