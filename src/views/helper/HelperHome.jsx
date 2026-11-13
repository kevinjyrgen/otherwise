import { Link } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import { formatMoney } from '../../format.js'
import { useLive } from '../../live.js'
import t from './HelperHome.strings.js'

const TODO = ['REQUESTED', 'DRAFT']

/** Pill colours per status; anything not listed is neutral grey. */
const pill = {
  PENDING_APPROVAL: 'bg-bright-green/15 text-bright-green',
  APPROVED: 'bg-bright-green/15 text-bright-green',
  SENT: 'bg-bright-green text-forest-green',
  FAILED: 'bg-red-400/20 text-red-300',
}

/** Helper's home: requests to prepare on top, everything she handed over below. */
export default function HelperHome() {
  const { me, transfers } = useLive()
  const todo = transfers.filter((x) => TODO.includes(x.status))
  const others = transfers.filter((x) => !TODO.includes(x.status))

  return (
    <Shell>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{t.greeting(me.name)}</h1>
      <p className="mt-2 text-white/60">{t.helping(me.ownerName)}</p>

      <h2 className="mt-8 font-bold text-white/60">{t.todoTitle}</h2>
      {todo.length === 0 && (
        <p className="mt-3 rounded-3xl bg-card p-5 text-white/60">{t.todoEmpty}</p>
      )}
      {todo.map((transfer) => (
        <section key={transfer.id} className="mt-3 rounded-3xl bg-card p-5">
          <p className="text-lg font-bold">{t.requested(transfer.ownerName)}</p>
          {transfer.note && <p className="mt-1 text-white/70">“{transfer.note}”</p>}
          <Button className="mt-4" to={`/helper/transfers/${transfer.id}`}>
            {transfer.status === 'DRAFT' ? t.resume : t.start}
          </Button>
        </section>
      ))}

      {others.length > 0 && (
        <>
          <h2 className="mt-8 font-bold text-white/60">{t.otherTitle}</h2>
          <ul className="mt-3 divide-y divide-white/10 rounded-3xl bg-card px-5">
            {others.map((transfer) => (
              <li key={transfer.id}>
                <Link to={`/helper/transfers/${transfer.id}`} className="flex items-center justify-between gap-4 py-4">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {transfer.description || t.untitled}
                    </span>
                    {transfer.sourceAmount && (
                      <span className="text-sm text-white/60">
                        {formatMoney(transfer.sourceAmount, transfer.sourceCurrency)}
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${pill[transfer.status] ?? 'bg-white/10 text-white/70'}`}>
                    {t.status[transfer.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Shell>
  )
}
