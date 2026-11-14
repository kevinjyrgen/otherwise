import { useState } from 'react'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import { formatMoney } from '../../format.js'
import { useLive } from '../../live.js'
import t from './OwnerPayments.strings.js'

/**
 * The owner's regular payments. Her helper set them up and she approved each
 * one once. From here she alone can skip the next payment or stop it for
 * good; the helper has no part in this page.
 */
export default function OwnerPayments() {
  const { me, schedules, send } = useLive()
  // The regular payment she is asked about stopping, or null.
  const [asking, setAsking] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  /** Runs one server step and shows its error, if any. */
  const run = async (action) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (problem) {
      setError(problem.message)
    }
    setBusy(false)
  }

  const setSkip = (schedule, skip) => run(() => send(`/owner/schedules/${schedule.id}/skip`, { skip }))

  const stop = () =>
    run(async () => {
      await send(`/owner/schedules/${asking.id}/stop`)
      setAsking(null)
    })

  if (asking) {
    return (
      <Shell>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.stopQuestion(asking.recipient.name)}</h1>
        <p className="mt-4 text-xl text-white/70">{t.stopText}</p>
        {error && <p className="mt-4 text-xl text-red-300">{error}</p>}
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <Button size="lg" variant="secondary" onClick={stop} disabled={busy}>
            {t.yesStop}
          </Button>
          <Button size="lg" onClick={() => setAsking(null)} disabled={busy}>
            {t.no}
          </Button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.title}</h1>

      {schedules.length === 0 ? (
        <section className="mt-6 rounded-3xl bg-card p-6">
          <h2 className="text-2xl font-bold">{t.emptyTitle}</h2>
          <p className="mt-2 text-xl text-white/70">{t.emptyText(me.helperName?.split(' ')[0])}</p>
        </section>
      ) : (
        <p className="mt-4 text-xl text-white/70">{t.text}</p>
      )}

      {error && <p className="mt-4 text-xl text-red-300">{error}</p>}

      {schedules.map((schedule) => (
        <section key={schedule.id} className="mt-4 rounded-3xl bg-card p-6">
          <p className="text-lg text-white/60">“{schedule.description}”</p>
          <h2 className="mt-1 text-2xl font-bold break-words">
            {t.to(formatMoney(schedule.amount, schedule.currency), schedule.recipient.name)}
          </h2>
          <p className="mt-3 text-xl">{t.when(schedule.dayOfMonth)}</p>
          {schedule.skipNext ? (
            <p className="mt-1 text-xl font-semibold text-brand-pink">{t.skipped(schedule.nextDate)}</p>
          ) : (
            <p className="mt-1 text-xl text-white/70">{t.next(schedule.nextDate)}</p>
          )}
          {schedule.preparedBy && (
            <p className="mt-3 text-lg text-white/60">{t.preparedBy(schedule.preparedBy)}</p>
          )}

          <Button
            size="lg"
            variant="secondary"
            className="mt-5"
            onClick={() => setSkip(schedule, !schedule.skipNext)}
            disabled={busy}
          >
            {schedule.skipNext ? t.unskip : t.skip}
          </Button>
          <button
            type="button"
            onClick={() => setAsking(schedule)}
            disabled={busy}
            className="mt-2 min-h-12 w-full text-lg text-white/60 underline"
          >
            {t.stop}
          </button>
        </section>
      ))}
    </Shell>
  )
}
