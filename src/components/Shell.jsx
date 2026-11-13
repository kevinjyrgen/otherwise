import { Link } from 'react-router-dom'
import { useLive } from '../live.js'
import Menu from './Menu.jsx'
import t from './menu.strings.js'
import { Bell, Toast } from './Notifications.jsx'
import Wordmark from './Wordmark.jsx'

/**
 * Page frame shared by every screen: a phone-width column with a "Prototype"
 * footer. Inside a role area it adds the main menu (sidebar on desktop, bottom
 * bar on a phone), the live dot, the bell and toasts, so notifications work
 * on every page.
 * @param {{children: React.ReactNode}} props
 */
export default function Shell({ children }) {
  const live = useLive()
  return (
    <div className="min-h-svh bg-ink text-white sm:flex sm:justify-center">
      {live && <Toast />}
      {live && <Menu />}
      {/* Extra bottom padding on a phone keeps content clear of the bottom bar. */}
      <div className={`mx-auto flex min-h-svh w-full max-w-[430px] flex-col px-5 sm:mx-0 sm:pb-6 ${live ? 'pb-24' : 'pb-6'}`}>
        <header className="flex min-h-20 items-center justify-between py-4">
          {/* On desktop the wordmark lives in the sidebar. */}
          <Link to={live ? `/${live.role}` : '/'} className={live ? 'sm:invisible' : ''}>
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
        <footer className="mt-10 flex items-center gap-3 text-xs text-white/40">
          <span className="rounded-full border border-white/20 px-2 py-0.5 font-semibold tracking-wide uppercase">
            {t.prototype}
          </span>
          <span>{t.prototypeNote}</span>
        </footer>
      </div>
    </div>
  )
}
