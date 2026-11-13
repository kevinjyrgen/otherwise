import Button from '../components/Button.jsx'
import menu from '../components/menu.strings.js'
import Shell from '../components/Shell.jsx'
import { useLive } from '../live.js'
import t from './NotInPrototype.strings.js'

/**
 * Friendly placeholder for the menu items that are outside this prototype
 * (Cards, Recipients, Payments, Account).
 * @param {{section: 'cards'|'recipients'|'payments'|'account'}} props
 */
export default function NotInPrototype({ section }) {
  const { role } = useLive()
  const name = menu.items[section].label

  return (
    <Shell>
      <p className="mt-10 font-bold text-white/60">{name}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{t.title}</h1>
      <p className="mt-4 text-lg text-white/70">{t.text(name)}</p>

      <div className="mt-8 flex flex-col gap-3">
        <Button to={`/${role}/guided`}>{t.guided}</Button>
        <Button variant="secondary" to={`/${role}`}>
          {t.home}
        </Button>
      </div>
    </Shell>
  )
}
