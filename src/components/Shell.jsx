import { Link } from 'react-router-dom'
import Wordmark from './Wordmark.jsx'

/**
 * Page frame shared by every screen: phone-width column, wordmark on top and
 * an optional live-connection dot.
 * @param {{connected?: boolean, connectionLabel?: string, children: React.ReactNode}} props
 */
export default function Shell({ connected, connectionLabel, children }) {
  return (
    <div className="min-h-svh bg-ink text-white">
      <div className="mx-auto flex min-h-svh max-w-[430px] flex-col px-5 pb-8">
        <header className="flex items-center justify-between py-5">
          <Link to="/">
            <Wordmark />
          </Link>
          {connected !== undefined && (
            <span className="flex items-center gap-2 text-sm text-white/60">
              <span
                className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-bright-green' : 'bg-red-400'}`}
              />
              {connectionLabel}
            </span>
          )}
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}
