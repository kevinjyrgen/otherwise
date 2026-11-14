import { useState } from 'react'
import Button from '../../components/Button.jsx'
import { reasonText } from '../../components/notifications.strings.js'
import Shell from '../../components/Shell.jsx'
import { formatMoney } from '../../format.js'
import { useLive } from '../../live.js'
import StatusIcon from '../../components/StatusIcon.jsx'
import t from './OwnerResult.strings.js'

/**
 * Steps 10–11 for the owner: what happened to the transfer, in plain words.
 * Also covers "still being prepared".
 *
 * After the money was sent she can save the recipient with one tap, to pay
 * them on her own next time. If the transfer started a regular payment, she
 * is told what happens from now on.
 * @param {{transfer: object}} props
 */
export default function OwnerResult({ transfer }) {
  const { recipients, send } = useLive()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { status } = transfer
  const sent = status === 'SENT'
  // The account number is what makes a saved recipient the same one.
  const saved = sent && recipients.some((r) => r.iban === transfer.recipient.iban)

  /** Saves who this transfer went to. The server copies them from the transfer. */
  const saveRecipient = async () => {
    setBusy(true)
    setError('')
    try {
      await send('/owner/recipients', { transferId: transfer.id })
    } catch (problem) {
      setError(problem.message)
    }
    setBusy(false)
  }

  // Direct transfers (sent on her own) have no helper.
  const helper = transfer.helperName?.split(' ')[0]
  const facts = {
    helper,
    recipient: transfer.recipient?.name,
    amount: transfer.sourceAmount && formatMoney(transfer.sourceAmount, transfer.sourceCurrency),
  }

  return (
    <Shell>
      <div className="mt-10">
        <StatusIcon status={status} big />
      </div>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight">{t.title[status](helper)}</h1>
      {reasonText.owner[transfer.reason] && (
        <p className="mt-4 text-2xl">{reasonText.owner[transfer.reason]}</p>
      )}
      <p className="mt-4 text-xl text-white/70">
        {transfer.direct && t.textDirect[status] ? t.textDirect[status](facts) : t.text[status](facts)}
      </p>
      {sent && <p className="mt-2 text-xl text-white/70">{t.arrives(transfer.arrivalDays)}</p>}

      {/* One of the monthly payments of a regular payment. */}
      {transfer.regular && <p className="mt-4 text-xl text-white/70">{t.regularRun}</p>}

      {/* This transfer started a regular payment. */}
      {sent && transfer.repeat && (
        <section className="mt-6 rounded-3xl bg-card p-6">
          <h2 className="text-2xl font-bold">{t.regularTitle}</h2>
          <p className="mt-2 text-xl text-white/70">{t.regularText(transfer.repeat.dayOfMonth)}</p>
          <Button size="lg" variant="secondary" className="mt-5" to="/owner/payments">
            {t.regularSee}
          </Button>
        </section>
      )}

      {sent && (
        <section className="mt-6 rounded-3xl bg-card p-6">
          {saved ? (
            <>
              <h2 className="text-2xl font-bold">{t.savedTitle(facts.recipient)}</h2>
              <p className="mt-2 text-xl text-white/70">{t.savedText}</p>
              <Button size="lg" variant="secondary" className="mt-5" to="/owner/recipients">
                {t.savedSee}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">{t.saveTitle(facts.recipient)}</h2>
              <p className="mt-2 text-xl text-white/70">{t.saveText}</p>
              <Button size="lg" variant="secondary" className="mt-5" onClick={saveRecipient} disabled={busy}>
                {t.save(facts.recipient)}
              </Button>
            </>
          )}
          {error && <p className="mt-4 text-xl text-red-300">{error}</p>}
        </section>
      )}

      <div className="mt-auto pt-8">
        <Button size="lg" to="/owner/guided">
          {t.done}
        </Button>
      </div>
    </Shell>
  )
}
