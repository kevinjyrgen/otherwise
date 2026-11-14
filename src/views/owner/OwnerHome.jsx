import { Link } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import { formatMoney } from '../../format.js'
import { useLive } from '../../live.js'
import t from './OwnerHome.strings.js'

const WAITING = ['PENDING_APPROVAL', 'APPROVED']
const PREPARING = ['REQUESTED', 'DRAFT']

/**
 * Owner's home screen. Shows one thing to do at a time: a transfer waiting
 * for her answer comes first; otherwise she can ask for a new one.
 */
export default function OwnerHome() {
  const { me, transfers } = useLive()
  const waiting = transfers.filter((x) => WAITING.includes(x.status))
  const preparing = transfers.filter((x) => PREPARING.includes(x.status))
  const earlier = transfers.filter((x) => t.status[x.status]).slice(0, 3)

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.greeting(me.name)}</h1>

      <section className="mt-6 rounded-3xl bg-forest-green p-6">
        <p className="text-xl text-bright-green">{t.balanceLabel}</p>
        <p className="mt-1 text-[40px] leading-tight font-extrabold tracking-tight">
          {formatMoney(me.balance, me.currency)}
        </p>
      </section>

      {waiting.map((transfer) => (
        <section key={transfer.id} className="mt-6 rounded-3xl bg-card p-6 ring-2 ring-bright-green">
          <h2 className="text-2xl font-bold">{t.waitingTitle(transfer.helperName)}</h2>
          <p className="mt-2 text-xl text-white/80">“{transfer.description}”</p>
          <Button size="lg" className="mt-5" to={`/owner/transfers/${transfer.id}`}>
            {t.look}
          </Button>
        </section>
      ))}

      {waiting.length === 0 && me.helperName && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold">{t.askTitle}</h2>
          <p className="mt-2 text-xl text-white/70">{t.askText(me.helperName)}</p>
          <Button size="lg" className="mt-5" to="/owner/request">
            {t.ask}
          </Button>
          {/* The easy way to ask: a photo of the bill instead of words. */}
          <Button size="lg" variant="secondary" className="mt-3" to="/owner/bill">
            {t.askBill}
          </Button>
        </section>
      )}

      {/* Without an active helper nothing can be prepared: lead her to the Helper page. */}
      {waiting.length === 0 && !me.helperName && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold">{t.noHelperTitle}</h2>
          <p className="mt-2 text-xl text-white/70">{t.noHelperText}</p>
          <Button size="lg" className="mt-5" to="/owner/helper">
            {me.link ? t.seeHelper : t.addHelper}
          </Button>
        </section>
      )}

      {preparing.map((transfer) => (
        <p key={transfer.id} className="mt-6 rounded-3xl bg-card p-6 text-xl text-white/80">
          {t.preparing(transfer.helperName.split(' ')[0])}
        </p>
      ))}

      {earlier.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-white/60">{t.recentTitle}</h2>
          <ul className="mt-2 divide-y divide-white/10">
            {earlier.map((transfer) => (
              <li key={transfer.id}>
                <Link
                  to={`/owner/transfers/${transfer.id}`}
                  className="flex min-h-16 items-center justify-between gap-4 py-3 text-xl"
                >
                  <span className="truncate">{transfer.description || t.noDescription}</span>
                  <span className="shrink-0 text-white/60">{t.status[transfer.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  )
}
