import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLive } from '../live.js'
import t, { notificationText } from './notifications.strings.js'

/** Where a notification leads: the transfer it is about. */
const linkFor = (role, notification) => `/${role}/transfers/${notification.transferId}`

/**
 * Banner that drops in when a notification arrives. Tapping it opens the
 * transfer; it goes away by itself after a few seconds.
 */
export function Toast() {
  const { role, toast, dismissToast } = useLive()
  const navigate = useNavigate()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(dismissToast, 8000)
    return () => clearTimeout(timer)
  }, [toast, dismissToast])

  if (!toast) return null
  const big = role === 'owner'
  return (
    <div className="fixed inset-x-0 top-3 z-20 mx-auto w-full max-w-[430px] animate-toast px-3">
      <button
        type="button"
        role="alert"
        onClick={() => {
          dismissToast()
          navigate(linkFor(role, toast))
        }}
        className={`w-full rounded-3xl bg-bright-green px-5 py-4 text-left font-semibold text-forest-green shadow-2xl shadow-black/60 ${big ? 'text-xl' : 'text-base'}`}
      >
        {notificationText(role, toast)}
      </button>
    </div>
  )
}

/** Bell with an unread badge. Opens the list and marks everything as read. */
export function Bell() {
  const { role, notifications, send } = useLive()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

  const toggle = () => {
    // First tap is a good moment to ask for system notifications (optional extra).
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    if (!open && unread > 0) send('/notifications/read').catch(console.error)
    setOpen(!open)
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t.bell}
        onClick={toggle}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-card text-white"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-bright-green px-1 text-sm font-bold text-forest-green">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 max-w-[calc(100vw-2.5rem)] rounded-3xl bg-card-hover p-2 shadow-2xl shadow-black/60">
          {notifications.length === 0 && <p className="p-4 text-white/60">{t.empty}</p>}
          {notifications.slice(0, 8).map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setOpen(false)
                navigate(linkFor(role, n))
              }}
              className={`block w-full rounded-2xl px-4 py-3 text-left hover:bg-white/10 ${n.read ? "text-white/70" : "font-semibold"}`}
            >
              {notificationText(role, n)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
