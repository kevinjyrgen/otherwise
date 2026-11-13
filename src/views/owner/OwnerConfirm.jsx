import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import { formatMoney } from '../../format.js'
import { useLive } from '../../live.js'
import t from './OwnerConfirm.strings.js'

/**
 * Step 9: the second confirmation. Only the three facts that matter, large:
 * what it is for, who gets it, how much.
 */
export default function OwnerConfirm() {
  const { id } = useParams()
  const { transfers, send } = useLive()
  const navigate = useNavigate()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const transfer = transfers.find((x) => x.id === id)
  const page = `/owner/transfers/${id}`

  // Only an approved transfer can be confirmed; anything else goes back to its page.
  if (!transfer) return <Navigate to="/owner/guided" replace />
  if (transfer.status !== 'APPROVED' && !sending) return <Navigate to={page} replace />

  const confirm = async () => {
    setSending(true)
    try {
      // The server only sends if these match what it has stored: she confirms
      // exactly the recipient and amount on this screen.
      await send(`${page}/confirm`, {
        iban: transfer.recipient.iban,
        amount: transfer.sourceAmount,
      })
      navigate(page, { replace: true })
    } catch (problem) {
      setError(problem.message)
      setSending(false)
    }
  }

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title}</h1>

      <section className="mt-6 flex flex-col gap-7 rounded-3xl bg-card p-6">
        <div>
          <p className="text-lg text-white/60">{t.what}</p>
          <p className="mt-1 text-3xl font-bold">{transfer.description}</p>
        </div>
        <div>
          <p className="text-lg text-white/60">{t.to}</p>
          <p className="mt-1 text-3xl font-bold break-words">{transfer.recipient.name}</p>
        </div>
        <div>
          <p className="text-lg text-white/60">{t.amount}</p>
          <p className="mt-1 text-5xl font-extrabold tracking-tight">
            {formatMoney(transfer.sourceAmount, transfer.sourceCurrency)}
          </p>
        </div>
      </section>

      {error && <p className="mt-4 text-xl text-red-300">{error}</p>}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button size="lg" onClick={confirm} disabled={sending}>
          {sending ? t.sending : t.confirm}
        </Button>
        <Button size="lg" variant="secondary" to={page} disabled={sending}>
          {t.back}
        </Button>
      </div>
    </Shell>
  )
}
