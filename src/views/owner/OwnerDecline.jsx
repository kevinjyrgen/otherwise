import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import { useLive } from '../../live.js'
import t from './OwnerDecline.strings.js'

/**
 * Step 8, the "no" branch: one tap on a reason declines the transfer. The
 * reason is passed on to the helper in plain words.
 */
export default function OwnerDecline() {
  const { id } = useParams()
  const { transfers, send } = useLive()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const transfer = transfers.find((x) => x.id === id)
  const page = `/owner/transfers/${id}`

  if (!transfer) return <Navigate to="/owner/guided" replace />
  if (!['PENDING_APPROVAL', 'APPROVED'].includes(transfer.status) && !busy) {
    return <Navigate to={page} replace />
  }

  const decline = async (reason) => {
    setBusy(true)
    try {
      await send(`${page}/decline`, { reason })
      navigate(page, { replace: true })
    } catch (problem) {
      setError(problem.message)
      setBusy(false)
    }
  }

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title}</h1>
      <p className="mt-4 text-xl text-white/70">{t.text(transfer.helperName.split(' ')[0])}</p>

      <div className="mt-8 flex flex-col gap-3">
        {Object.entries(t.reasons).map(([reason, label]) => (
          <Button key={reason} size="lg" variant="secondary" onClick={() => decline(reason)} disabled={busy}>
            {label}
          </Button>
        ))}
      </div>

      {error && <p className="mt-4 text-xl text-red-300">{error}</p>}

      <div className="mt-auto pt-8">
        <Button size="lg" to={page}>
          {t.back}
        </Button>
      </div>
    </Shell>
  )
}
