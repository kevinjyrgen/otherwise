import { Link, useLocation } from 'react-router-dom'
import { useLive } from '../live.js'
import t from './menu.strings.js'
import { PLACEHOLDER_SECTIONS } from './menuSections.js'
import Wordmark from './Wordmark.jsx'

/**
 * Menu items in order. `path` is relative to the role area ("/owner" or
 * "/helper"); `icon` is the SVG path of a simple line icon.
 */
const ITEMS = [
  { key: 'home', path: '', icon: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z' },
  { key: 'cards', path: '/cards', icon: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18' },
  { key: 'recipients', path: '/recipients', icon: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.9M15.5 4.2a3.5 3.5 0 0 1 0 6.6' },
  { key: 'payments', path: '/payments', icon: 'M7 4v16M7 4L3.5 7.5M7 4l3.5 3.5M17 20V4M17 20l-3.5-3.5M17 20l3.5-3.5' },
  { key: 'guided', path: '/guided', icon: 'M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z' },
  { key: 'helper', path: '/helper', ownerOnly: true, icon: 'M15 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19 8v6M22 11h-6' },
  { key: 'account', path: '/account', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 20a8 8 0 0 1 16 0' },
]

/** Which menu item the current URL belongs to. Everything in the flow counts as "guided". */
function activeKey(role, pathname) {
  const rest = pathname.slice(`/${role}`.length).replace(/\/$/, '')
  if (rest === '') return 'home'
  const section = rest.split('/')[1]
  if (PLACEHOLDER_SECTIONS.includes(section) || section === 'helper') return section
  // "Send money" starts from Home; everything else is the guided flow.
  return section === 'send' ? 'home' : 'guided'
}

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

/**
 * Main menu: a left sidebar from tablet width up, a bottom bar on a phone.
 * The Guided Transfers item carries the "New" badge and the unread count, so
 * a notification is visible on every page.
 */
export default function Menu() {
  const { role, notifications } = useLive()
  const { pathname } = useLocation()
  const active = activeKey(role, pathname)
  const unread = notifications.filter((n) => !n.read).length
  const items = ITEMS.filter((item) => !item.ownerOnly || role === 'owner')
  const countBadge = unread > 0 && (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-pink px-1 text-xs font-bold text-brand-green">
      {unread}
    </span>
  )

  return (
    <>
      {/* Desktop: sidebar */}
      <nav
        aria-label={t.menu}
        className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-white/5 px-3 py-6 sm:flex"
      >
        <Link to={`/${role}`} className="px-3">
          <Wordmark />
        </Link>
        <ul className="mt-8 flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                to={`/${role}${item.path}`}
                aria-current={active === item.key ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-full px-3 font-semibold transition ${
                  active === item.key ? 'bg-card-hover text-white' : 'text-white/60 hover:bg-card hover:text-white'
                }`}
              >
                <Icon path={item.icon} />
                <span className="flex-1 text-sm whitespace-nowrap">{t.items[item.key].label}</span>
                {item.key === 'guided' &&
                  (countBadge || (
                    <span className="rounded-full bg-brand-pink/15 px-2 py-0.5 text-xs font-bold text-brand-pink">
                      {t.newBadge}
                    </span>
                  ))}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Phone: bottom bar */}
      <nav
        aria-label={t.menu}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="mx-auto flex max-w-[430px]">
          {items.map((item) => (
            <li key={item.key} className="min-w-0 flex-1">
              <Link
                to={`/${role}${item.path}`}
                aria-current={active === item.key ? 'page' : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
                  active === item.key ? 'text-brand-pink' : 'text-white/60'
                }`}
              >
                <Icon path={item.icon} />
                <span className="max-w-full truncate">{t.items[item.key].short}</span>
                {item.key === 'guided' && (
                  <span className="absolute top-1 left-1/2 ml-2">
                    {countBadge || (
                      <span className="rounded-full bg-brand-pink px-1.5 text-[9px] font-bold text-brand-green">
                        {t.newBadge}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
