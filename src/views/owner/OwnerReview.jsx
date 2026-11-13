import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Rows from '../../components/Rows.jsx'
import Shell from '../../components/Shell.jsx'
import { formatIban, formatMoney } from '../../format.js'
import { useLive } from '../../live.js'
import t from './OwnerReview.strings.js'

/**
 * Steps 7–8: the owner sees every detail plus the helper's description and
 * approves. Approving sends nothing yet; it leads to the final confirmation.
 * @param {{transfer: object}} props
 */
export default function OwnerReview({ transfer }) {
  const { send } = useLive()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const foreign = transfer.targetCurrency !== transfer.sourceCurrency

  const approve = async () => {
    setBusy(true)
    try {
      await send(`/owner/transfers/${transfer.id}/approve`)
      navigate(`/owner/transfers/${transfer.id}/confirm`)
    } catch (problem) {
      setError(problem.message)
      setBusy(false)
    }
  }

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title}</h1>

      <section className="mt-6 rounded-3xl bg-card p-6">
        <p className="text-lg text-white/60">{t.preparedBy(transfer.helperName)}</p>
        <p className="mt-2 text-2xl font-semibold">“{transfer.description}”</p>
      </section>

      <section className="mt-4 rounded-3xl bg-card px-6 py-2">
        <Rows
          big
          rows={[
            [t.to, transfer.recipient.name],
            [t.iban, formatIban(transfer.recipient.iban)],
            [t.amount, formatMoney(transfer.sourceAmount, transfer.sourceCurrency)],
            foreign && [t.theyGet, formatMoney(transfer.targetAmount, transfer.targetCurrency)],
            [t.fee, formatMoney(transfer.fee, transfer.sourceCurrency)],
            [
              t.total,
              <span key="total" className="text-[40px] leading-tight font-extrabold">
                {formatMoney(transfer.total, transfer.sourceCurrency)}
              </span>,
            ],
            [t.arrives, t.arrival(transfer.arrivalDays)],
            [t.preparedLabel, transfer.helperName],
          ]}
        />
      </section>

      {error && <p className="mt-4 text-xl text-red-300">{error}</p>}

      <div className="mt-8 flex flex-col gap-3">
        <Button size="lg" onClick={approve} disabled={busy}>
          {t.approve}
        </Button>
      </div>
    </Shell>
  )
}
