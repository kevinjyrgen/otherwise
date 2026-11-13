import { Link } from 'react-router-dom'
import { useLive } from '../live.js'
import { Bell, Toast } from './Notifications.jsx'
import Wordmark from './Wordmark.jsx'

/**
 * Page frame shared by every screen: phone-width column with the wordmark on
 * top. Inside a role area it also shows the live dot, the bell and toasts.
 * @param {{children: React.ReactNode}} props
 */
export default function Shell({ children }) {
  const live = useLive()
  return (
    <div className="min-h-svh bg-ink text-white">
      {live && <Toast />}
      <div className="mx-auto flex min-h-svh max-w-[430px] flex-col px-5 pb-8 sm:border-x sm:border-white/5">
        <header className="flex min-h-20 items-center justify-between py-4">
          <Link to={live ? `/${live.role}` : '/'}>
            <Wordmark />
          </Link>
          {live && (
            <div className="flex items-center gap-3">
              <span
                title={live.connected ? 'Live' : 'Offline'}
                className={`h-2.5 w-2.5 rounded-full ${live.connected ? 'bg-bright-green' : 'bg-red-400'}`}
              />
              <Bell />
            </div>
          )}
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}
