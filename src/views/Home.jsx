import Avatar from '../components/Avatar.jsx'
import Button from '../components/Button.jsx'
import Shell from '../components/Shell.jsx'
import { formatMoney } from '../format.js'
import { useLive } from '../live.js'
import Invitations from './helper/Invitations.jsx'
import t from './Home.strings.js'

/** One balance card: currency badge on top, amount below. */
function BalanceCard({ currency, amount, main }) {
  return (
    <li
      className={`flex min-h-36 w-44 shrink-0 snap-start flex-col justify-between rounded-3xl p-5 ${main ? 'bg-forest-green' : 'bg-card'}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
        {currency}
      </span>
      <span>
        <span className="block text-2xl font-extrabold tracking-tight">
          {formatMoney(amount, '').trim()}
        </span>
        <span className="text-sm text-white/60">{currency}</span>
      </span>
    </li>
  )
}

/** One row of the activity list. Money coming in is shown in green with a plus. */
function ActivityRow({ title, detail, amount, currency }) {
  const incoming = amount > 0
  return (
    <li className="flex items-center gap-4 py-4">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card-hover text-lg"
      >
        {incoming ? '↓' : '↑'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-sm text-white/60">{detail}</span>
      </span>
      <span className={`shrink-0 font-semibold ${incoming ? 'text-bright-green' : ''}`}>
        {incoming ? '+' : '−'}
        {formatMoney(Math.abs(amount), currency)}
      </span>
    </li>
  )
}

/** Chooses the card that leads into Guided Transfers for this person's situation. */
function pickPromo(isOwner, me, other) {
  if (!isOwner) {
    if (!other) return t.promo.helperNoOwner
    return { ...t.promo.helper, title: t.promo.helper.title(other), to: '/helper/guided' }
  }
  if (other) return { ...t.promo.owner, text: t.promo.owner.text(other), to: '/owner/guided' }
  return { ...(me.link ? t.promo.ownerWaiting : t.promo.ownerNoHelper), to: '/owner/helper' }
}

/**
 * Mock app home page, shown right after "logging in": the person's name,
 * their balances, a way into Guided Transfers and recent activity.
 * Works for both roles; each sees only their own money.
 */
export default function Home() {
  const { role, me, transfers } = useLive()
  const isOwner = role === 'owner'
  // Who the other person is, if the link between them is active.
  const other = (isOwner ? me.helperName : me.ownerName)?.split(' ')[0]
  const promo = pickPromo(isOwner, me, other)

  // Owner: her real EUR balance first, then the mock ones. Helper: mock only.
  const balances = [
    ...(isOwner ? [{ currency: me.currency, amount: me.balance }] : []),
    ...t.mockBalances[role],
  ]

  // Transfers the owner really sent in this demo appear on top of the mock rows.
  const sent = isOwner
    ? transfers
        .filter((x) => x.status === 'SENT')
        .map((x) => ({
          title: x.recipient.name,
          detail: x.regular
            ? `${t.regularPayment} · ${x.description}`
            : x.direct
              ? t.sentByYou
              : `${t.guidedTransfer} · ${x.description}`,
          amount: -x.total,
          currency: x.sourceCurrency,
        }))
    : []
  const activity = [...sent, ...t.mockActivity[role]].slice(0, 4)

  return (
    <Shell>
      <div className="mt-2 flex items-center gap-4">
        <Avatar name={me.name} className="h-14 w-14 text-lg" />
        <h1 className="text-3xl font-extrabold tracking-tight">{t.greeting(me.name.split(' ')[0])}</h1>
      </div>

      <h2 className="mt-8 font-bold text-white/60">{t.balances}</h2>
      {/* Bleeds to the screen edge so more cards can be swiped in. */}
      <ul className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-1">
        {balances.map((balance, index) => (
          <BalanceCard key={balance.currency} {...balance} main={index === 0} />
        ))}
      </ul>

      {isOwner && (
        <Button className="mt-5" to="/owner/send">
          {t.sendMoney}
        </Button>
      )}

      {/* Invites arrive live and must be visible on the home page. */}
      {!isOwner && <Invitations />}

      <section className="mt-6 rounded-3xl bg-card p-5 ring-1 ring-bright-green/40">
        <h2 className="text-xl font-bold">{promo.title}</h2>
        <p className="mt-1 text-white/70">{promo.text}</p>
        {promo.button && (
          <Button className="mt-4" variant={isOwner ? 'secondary' : 'primary'} to={promo.to}>
            {promo.button}
          </Button>
        )}
      </section>

      <h2 className="mt-8 font-bold text-white/60">{t.activity}</h2>
      <ul className="mt-1 divide-y divide-white/10">
        {activity.map((row) => (
          <ActivityRow key={`${row.title}-${row.detail}`} {...row} />
        ))}
      </ul>
    </Shell>
  )
}
