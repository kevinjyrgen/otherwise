import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar.jsx'
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

/** Landing screen: pick which demo user this window is. */
export default function RolePicker() {
  return (
    <Shell>
      <h1 className="mt-10 text-4xl font-extrabold tracking-tight">{t.title}</h1>
      <p className="mt-3 text-lg text-white/60">{t.subtitle}</p>
      <div className="mt-8 flex flex-col gap-4">
        <RoleCard to="/owner" name={t.ownerName} role={t.ownerRole} />
        <RoleCard to="/helper" name={t.helperName} role={t.helperRole} />
      </div>
    </Shell>
  )
}
