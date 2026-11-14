import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import Shell from '../components/Shell.jsx'
import { formatDay } from '../format.js'
import t from './RolePicker.strings.js'

/** One tappable card per demo user. */
function RoleCard({ to, name, role }) {
  return (
    <Link
      to={to}
      className="flex min-h-24 items-center gap-4 rounded-3xl bg-card px-6 py-5 transition hover:bg-card-hover active:scale-[0.98]"
    >
      <Avatar name={name} className="h-14 w-14 text-lg" />
      <span className="flex-1">
        <span className="block text-2xl font-bold">{name}</span>
        <span className="mt-1 block text-lg text-white/60">{role}</span>
      </span>
      <span aria-hidden="true" className="text-2xl text-white/40">
        ›
      </span>
    </Link>
  )
}

/**
 * Landing screen: pick which demo user this window is, reset the demo to a
 * starting point, or move the demo's calendar so a regular payment can be shown.
 */
export default function RolePicker() {
  const [message, setMessage] = useState('')
  // The demo's calendar: { today, nextPayment }. Null until the server answered.
  const [clock, setClock] = useState(null)
  const [clockMessage, setClockMessage] = useState('')

  const loadClock = useCallback(async () => {
    try {
      const response = await fetch('/api/dev/clock')
      if (response.ok) setClock(await response.json())
    } catch {
      // Server not running: the reset buttons already say so when tapped.
    }
  }, [])

  useEffect(() => {
    loadClock()
  }, [loadClock])

  /** Moves the demo's calendar; regular payments due on the way happen. */
  const advance = async (to) => {
    setClockMessage('')
    try {
      const response = await fetch('/api/dev/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to }),
      })
      const data = await response.json()
      if (response.ok) setClock(data)
      else setClockMessage(data.error || t.clockFailed)
    } catch {
      setClockMessage(t.clockFailed)
    }
  }

  /** Reseeds the server; open windows refresh by themselves. */
  const reset = async (scenario) => {
    try {
      const response = await fetch('/api/dev/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })
      setMessage(response.ok ? t.resetDone : t.resetFailed)
      setClockMessage('')
      loadClock()
    } catch {
      setMessage(t.resetFailed)
    }
  }

  return (
    <Shell>
      <h1 className="mt-10 text-4xl font-extrabold tracking-tight">{t.title}</h1>
      <p className="mt-3 text-lg text-white/60">{t.subtitle}</p>
      <div className="mt-8 flex flex-col gap-4">
        <RoleCard to="/owner" name={t.ownerName} role={t.ownerRole} />
        <RoleCard to="/helper" name={t.helperName} role={t.helperRole} />
      </div>

      <h2 className="mt-12 font-bold text-white/60">{t.resetTitle}</h2>
      <div className="mt-3 flex flex-col gap-3">
        <Button variant="secondary" onClick={() => reset('no-helper')}>
          {t.resetNoHelper}
        </Button>
        <p className="-mt-1 text-center text-sm text-white/50">{t.resetNoHelperHint}</p>
        <Button variant="secondary" onClick={() => reset('with-helper')}>
          {t.resetWithHelper}
        </Button>
        <p className="-mt-1 text-center text-sm text-white/50">{t.resetWithHelperHint}</p>
      </div>
      {message && (
        <p role="status" className="mt-4 text-center font-semibold text-bright-green">
          {message}
        </p>
      )}

      <h2 className="mt-12 font-bold text-white/60">{t.clockTitle}</h2>
      {clock && (
        <p className="mt-3 rounded-3xl bg-card p-5">
          <span className="block text-lg font-bold">{t.clockToday(formatDay(clock.today))}</span>
          <span className="mt-1 block text-white/60">
            {clock.nextPayment ? t.clockNext(formatDay(clock.nextPayment)) : t.clockNone}
          </span>
        </p>
      )}
      <div className="mt-3 flex flex-col gap-3">
        <Button variant="secondary" onClick={() => advance('reminder')} disabled={!clock?.nextPayment}>
          {t.clockReminder}
        </Button>
        <p className="-mt-1 text-center text-sm text-white/50">{t.clockReminderHint}</p>
        <Button variant="secondary" onClick={() => advance('next-day')}>
          {t.clockNextDay}
        </Button>
        <p className="-mt-1 text-center text-sm text-white/50">{t.clockNextDayHint}</p>
      </div>
      {clockMessage && (
        <p role="status" className="mt-4 text-center font-semibold text-red-300">
          {clockMessage}
        </p>
      )}
    </Shell>
  )
}
