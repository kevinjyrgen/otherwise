import { useEffect, useState } from 'react'
import { api, USER_ID } from '../../api.js'
import Shell from '../../components/Shell.jsx'
import { useSocket } from '../../socket.js'
import t from './OwnerHome.strings.js'

/** Formats an amount the way the owner reads it, e.g. "1,240.50 EUR". */
function formatMoney(amount, currency) {
  return `${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

/** Owner's home screen. Empty for now: greeting and balance only. */
export default function OwnerHome() {
  const { connected } = useSocket(USER_ID.owner)
  const [me, setMe] = useState(null)

  useEffect(() => {
    api(USER_ID.owner, '/me').then(setMe).catch(console.error)
  }, [])

  return (
    <Shell connected={connected} connectionLabel={connected ? t.live : t.offline}>
      {me && (
        <>
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight">{t.greeting(me.name)}</h1>
          <section className="mt-8 rounded-3xl bg-card p-6">
            <p className="text-xl text-white/60">{t.balanceLabel}</p>
            <p className="mt-2 text-[40px] leading-tight font-extrabold tracking-tight">
              {formatMoney(me.balance, me.currency)}
            </p>
          </section>
          <p className="mt-8 text-xl text-white/60">{t.empty}</p>
        </>
      )}
    </Shell>
  )
}
