import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Avatar from '../../components/Avatar.jsx'
import Button from '../../components/Button.jsx'
import Shell from '../../components/Shell.jsx'
import StatusIcon from '../../components/StatusIcon.jsx'
import { formatIban, formatMoney } from '../../format.js'
import { useLive } from '../../live.js'
import t from './OwnerSend.strings.js'

const inputClass = 'mt-3 min-h-16 w-full rounded-2xl bg-card px-5 text-xl'

/**
 * Basic "Send money" for the owner. After the amount the server decides: if
 * her help setting covers it, nothing is sent and it becomes a help request
 * ("Mari will prepare this for you"). Otherwise she fills in the recipient
 * and sends it herself.
 *
 * Someone she saved earlier needs no typing: coming from the Recipients page
 * (`?to=…`) the details step is skipped, and on the details step her saved
 * people are offered above the empty fields. The help setting applies to them
 * like to anyone else.
 */
export default function OwnerSend() {
  const { me, send, recipients } = useLive()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // The saved recipient she came here to pay, if any. Fixed for this visit.
  const [preset] = useState(() => recipients.find((r) => r.id === params.get('to')) ?? null)
  // The saved recipient being paid: the preset one, or one picked on the details step.
  const [picked, setPicked] = useState(preset)
  // 'amount' → 'details' → 'check', or 'amount' → 'help'. A preset recipient skips 'details'.
  const [step, setStep] = useState('amount')
  const [amountText, setAmountText] = useState('')
  const [name, setName] = useState('')
  const [iban, setIban] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Kept from the moment of asking, in case the helper changes meanwhile.
  const [helped, setHelped] = useState(null)

  const amount = Number(amountText.replace(',', '.'))

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

  const checkAmount = () =>
    run(async () => {
      const link = me.link
      // With a saved recipient this call only checks; if it becomes a help
      // request, the helper gets the recipient already filled in.
      const { outcome } = await send('/owner/send', {
        amount,
        ...(preset && { recipientId: preset.id, checkOnly: true }),
      })
      if (outcome === 'HELP_REQUESTED') {
        setHelped({ ...link, helper: link.helper.name.split(' ')[0] })
        setStep('help')
      } else {
        setStep(preset ? 'check' : 'details')
      }
    })

  /** On the details step: a saved person instead of typing. */
  const pick = (recipient) => {
    setPicked(recipient)
    setStep('check')
  }

  /** Back from the check screen, to wherever the recipient came from. */
  const backFromCheck = () => {
    if (preset) return setStep('amount')
    setPicked(null)
    setStep('details')
  }

  // What the check screen shows and what is sent.
  const to = picked ?? { name, iban: iban.replace(/\s+/g, '').toUpperCase() }

  const sendNow = () =>
    run(async () => {
      const { outcome, transfer } = await send('/owner/send', {
        amount,
        ...(picked ? { recipientId: picked.id } : { recipient: { name, iban } }),
      })
      // The setting may have changed since step 1: then it became a help request after all.
      navigate(outcome === 'HELP_REQUESTED' ? '/owner/guided' : `/owner/transfers/${transfer.id}`)
    })

  return (
    <Shell>
      {step === 'amount' && (
        <>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
            {preset ? t.amountTitleTo(preset.name) : t.amountTitle}
          </h1>
          <div className="mt-8 flex items-center rounded-2xl border border-white/10 bg-card pr-5 focus-within:border-brand-pink">
            <input
              inputMode="decimal"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              placeholder="0"
              aria-label={t.amountTitle}
              className="min-h-20 w-full border-0 bg-transparent px-5 text-5xl font-extrabold placeholder:text-white/30 focus:outline-none"
            />
            <span className="text-3xl font-bold">{me.currency}</span>
          </div>
          {error && <p className="mt-4 text-xl text-red-300">{error}</p>}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button size="lg" onClick={checkAmount} disabled={busy || !(amount > 0)}>
              {t.next}
            </Button>
            <Button size="lg" variant="secondary" to={preset ? '/owner/recipients' : '/owner'}>
              {t.back}
            </Button>
          </div>
        </>
      )}

      {step === 'details' && (
        <>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.detailsTitle}</h1>
          {recipients.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xl text-white/70">{t.savedTitle}</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {recipients.map((recipient) => (
                  <li key={recipient.id}>
                    <button
                      type="button"
                      onClick={() => pick(recipient)}
                      className="flex min-h-20 w-full items-center gap-4 rounded-3xl bg-card px-5 py-3 text-left transition hover:bg-card-hover active:scale-[0.98]"
                    >
                      <Avatar name={recipient.name} />
                      <span className="min-w-0 flex-1 text-2xl font-bold break-words">{recipient.name}</span>
                      <span aria-hidden="true" className="text-2xl text-white/40">
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <h2 className="mt-8 text-xl text-white/70">{t.someoneNew}</h2>
            </section>
          )}
          <label className={`${recipients.length > 0 ? 'mt-4' : 'mt-8'} block text-xl`}>
            {t.name}
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" className={inputClass} />
          </label>
          <label className="mt-6 block text-xl">
            {t.iban}
            <input value={iban} onChange={(event) => setIban(event.target.value)} autoComplete="off" autoCapitalize="characters" className={inputClass} />
          </label>
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button size="lg" onClick={() => setStep('check')} disabled={!name.trim() || !iban.trim()}>
              {t.next}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setStep('amount')}>
              {t.back}
            </Button>
          </div>
        </>
      )}

      {step === 'check' && (
        <>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{t.checkTitle}</h1>
          <section className="mt-6 flex flex-col gap-7 rounded-3xl bg-card p-6">
            <div>
              <p className="text-lg text-white/60">{t.to}</p>
              <p className="mt-1 text-3xl font-bold break-words">{to.name}</p>
            </div>
            <div>
              <p className="text-lg text-white/60">{t.account}</p>
              <p className="mt-1 text-2xl font-semibold break-words">{formatIban(to.iban)}</p>
            </div>
            <div>
              <p className="text-lg text-white/60">{t.amount}</p>
              <p className="mt-1 text-5xl font-extrabold tracking-tight">
                {formatMoney(amount, me.currency)}
              </p>
            </div>
          </section>
          {error && <p className="mt-4 text-xl text-red-300">{error}</p>}
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <Button size="lg" onClick={sendNow} disabled={busy}>
              {busy ? t.sending : t.send}
            </Button>
            <Button size="lg" variant="secondary" onClick={backFromCheck} disabled={busy}>
              {t.back}
            </Button>
          </div>
        </>
      )}

      {step === 'help' && (
        <>
          <div className="mt-10">
            <StatusIcon status="REQUESTED" big />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight">{t.helpTitle(helped.helper)}</h1>
          <p className="mt-4 text-2xl">{t.helpWhy(helped.helpMode, helped.threshold)}</p>
          <p className="mt-4 text-xl text-white/70">{t.helpText(helped.helper)}</p>
          <div className="mt-auto pt-8">
            <Button size="lg" to="/owner/guided">
              {t.done}
            </Button>
          </div>
        </>
      )}
    </Shell>
  )
}
