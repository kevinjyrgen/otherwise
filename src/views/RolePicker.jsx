import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import Shell from '../components/Shell.jsx'
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

/** Landing screen: pick which demo user this window is, or reset the demo to a starting point. */
export default function RolePicker() {
  const [message, setMessage] = useState('')

  /** Reseeds the server; open windows refresh by themselves. */
  const reset = async (scenario) => {
    try {
      const response = await fetch('/api/dev/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      })
      setMessage(response.ok ? t.resetDone : t.resetFailed)
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
    </Shell>
  )
}
