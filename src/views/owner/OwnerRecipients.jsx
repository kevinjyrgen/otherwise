import { useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import { formatIban } from '../../format.js'
import { useLive } from '../../live.js'
import t from './OwnerRecipients.strings.js'

/**
 * The owner's saved recipients: people she has already paid once, with a
 * transfer she confirmed herself. From here she pays them again by choosing
 * only the amount. Nobody else can add to this list.
 */
export default function OwnerRecipients() {
  const { recipients, send } = useLive()
  // The recipient she is asked about removing, or null.
  const [asking, setAsking] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const remove = async () => {
    setBusy(true)
    setError('')
    try {
      await send(`/owner/recipients/${asking.id}`, undefined, 'DELETE')
      setAsking(null)
    } catch (problem) {
      setError(problem.message)
    }
    setBusy(false)
  }

  if (asking) {
    return (
      <Shell>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.removeQuestion(asking.name)}</h1>
        <p className="mt-4 text-xl text-white/70">{t.removeText}</p>
        {error && <p className="mt-4 text-xl text-red-300">{error}</p>}
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button size="lg" variant="secondary" onClick={remove} disabled={busy}>
            {t.yesRemove}
          </Button>
          <Button size="lg" onClick={() => setAsking(null)} disabled={busy}>
            {t.no(asking.name)}
          </Button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title}</h1>

      {recipients.length === 0 ? (
        <section className="mt-6 rounded-3xl bg-card p-6">
          <h2 className="text-2xl font-bold">{t.emptyTitle}</h2>
          <p className="mt-2 text-xl text-white/70">{t.emptyText}</p>
        </section>
      ) : (
        <p className="mt-4 text-xl text-white/70">{t.text}</p>
      )}

      {recipients.map((recipient) => (
        <section key={recipient.id} className="mt-4 rounded-3xl bg-card p-6">
          <div className="flex items-center gap-4">
            <Avatar name={recipient.name} className="h-16 w-16 text-xl" />
            <div className="min-w-0">
              <p className="text-2xl font-bold break-words">{recipient.name}</p>
              <p className="mt-1 text-lg break-words text-white/60">{formatIban(recipient.iban)}</p>
            </div>
          </div>
          <Button size="lg" className="mt-5" to={`/owner/send?to=${recipient.id}`}>
            {t.pay}
          </Button>
          <button
            type="button"
            onClick={() => setAsking(recipient)}
            className="mt-2 min-h-12 w-full text-lg text-white/60 underline"
          >
            {t.remove}
          </button>
        </section>
      ))}
    </Shell>
  )
}
