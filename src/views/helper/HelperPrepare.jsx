import { useEffect, useState } from 'react'
import Button from '../../components/Button.jsx'
import Rows from '../../components/Rows.jsx'
import Shell from '../../components/Shell.jsx'
import Stepper from '../../components/Stepper.jsx'
import { formatIban, formatMoney } from '../../format.js'
import { useLive } from '../../live.js'
import t from './HelperPrepare.strings.js'

const MAX_DESCRIPTION = 120
const inputClass = 'mt-2 min-h-12 w-full rounded-xl bg-card px-4 placeholder:text-white/30'

/** "12,5" and "12.5" both mean 12.5. */
const parseAmount = (text) => Number(String(text).replace(',', '.'))

/** Labelled text input. */
function Field({ label, ...props }) {
  return (
    <label className="mt-5 block text-sm text-white/70">
      {label}
      <input className={`${inputClass} text-base text-white`} {...props} />
    </label>
  )
}

/**
 * Steps 3–5: the helper's form, shaped like a send-money flow: amount,
 * recipient, review with a description, then "Send for approval". Each
 * "Continue" saves the draft on the server, so nothing is lost on reload.
 * @param {{transfer: object}} props a REQUESTED or DRAFT transfer
 */
export default function HelperPrepare({ transfer }) {
  const { call, send } = useLive()
  const owner = transfer.ownerName
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    amount: transfer.sourceAmount ? String(transfer.sourceAmount) : '',
    currency: transfer.targetCurrency,
    name: transfer.recipient.name,
    iban: transfer.recipient.iban,
    email: transfer.recipient.email,
    description: transfer.description,
  })
  const [currencies, setCurrencies] = useState([transfer.targetCurrency])
  const [quote, setQuote] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const amount = parseAmount(form.amount)
  const path = `/helper/transfers/${transfer.id}`

  useEffect(() => {
    call('/helper/currencies').then(setCurrencies).catch(console.error)
  }, [call])

  // Live quote while typing, slightly delayed so not every keystroke asks the server.
  useEffect(() => {
    if (!(amount > 0)) return
    const timer = setTimeout(() => {
      call(`/helper/quote?amount=${amount}&currency=${form.currency}`)
        .then(setQuote)
        .catch(() => setQuote(null))
    }, 200)
    return () => clearTimeout(timer)
  }, [amount, form.currency, call])

  // Only show a quote that belongs to what is typed right now.
  const shownQuote =
    quote && quote.sourceAmount === amount && quote.targetCurrency === form.currency ? quote : null

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

  const saveAmount = () =>
    run(async () => {
      await send(path, { sourceAmount: amount, targetCurrency: form.currency }, 'PUT')
      setStep(1)
    })

  const saveRecipient = () =>
    run(async () => {
      await send(path, { recipient: { name: form.name, iban: form.iban, email: form.email } }, 'PUT')
      setStep(2)
    })

  const submit = () =>
    run(async () => {
      await send(path, { description: form.description }, 'PUT')
      // After this the transfer is PENDING_APPROVAL and this form is replaced
      // by the waiting screen.
      await send(`${path}/submit`)
    })

  return (
    <Shell>
      <Stepper steps={t.steps} current={step} />

      {transfer.note && (
        <p className="mt-6 rounded-2xl bg-card p-4 text-sm">
          <span className="text-white/60">{t.note(owner)}: </span>“{transfer.note}”
        </p>
      )}

      {step === 0 && (
        <>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{t.amountTitle}</h1>
          <label className="mt-5 block text-sm text-white/70">
            {t.youSend(owner)}
            <div className="mt-2 flex items-center rounded-xl bg-card pr-4">
              <input
                inputMode="decimal"
                value={form.amount}
                onChange={set('amount')}
                placeholder="0.00"
                className="min-h-16 w-full bg-transparent px-4 text-3xl font-bold text-white placeholder:text-white/30 focus:outline-none"
              />
              <span className="text-xl font-bold text-white">{transfer.sourceCurrency}</span>
            </div>
          </label>
          <label className="mt-5 block text-sm text-white/70">
            {t.recipientGets}
            <div className="mt-2 flex items-center rounded-xl bg-card pr-4">
              <span className="min-h-16 w-full px-4 text-3xl leading-[4rem] font-bold text-white">
                {shownQuote ? formatMoney(shownQuote.targetAmount, '').trim() : '–'}
              </span>
              <select
                value={form.currency}
                onChange={set('currency')}
                className="bg-card text-xl font-bold text-white"
              >
                {currencies.map((code) => (
                  <option key={code}>{code}</option>
                ))}
              </select>
            </div>
          </label>

          {shownQuote && (
            <div className="mt-5 rounded-2xl bg-card px-4">
              <Rows
                rows={[
                  [
                    t.rate,
                    `1 ${shownQuote.sourceCurrency} = ${shownQuote.rate} ${shownQuote.targetCurrency}${shownQuote.mock ? ` (${t.mockRate})` : ''}`,
                  ],
                  [t.fee, formatMoney(shownQuote.fee, shownQuote.sourceCurrency)],
                  [t.total(owner), formatMoney(shownQuote.total, shownQuote.sourceCurrency)],
                ]}
              />
            </div>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{t.recipientTitle}</h1>
          <Field label={t.name} value={form.name} onChange={set('name')} autoComplete="off" />
          <Field label={t.iban} value={form.iban} onChange={set('iban')} autoComplete="off" autoCapitalize="characters" />
          <Field label={t.email} value={form.email} onChange={set('email')} type="email" autoComplete="off" />
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{t.reviewTitle}</h1>
          <div className="mt-4 rounded-2xl bg-card px-4">
            <Rows
              rows={[
                [t.to, transfer.recipient.name],
                [t.iban, formatIban(transfer.recipient.iban)],
                [t.amount, formatMoney(transfer.sourceAmount, transfer.sourceCurrency)],
                [t.recipientGets, formatMoney(transfer.targetAmount, transfer.targetCurrency)],
                [t.fee, formatMoney(transfer.fee, transfer.sourceCurrency)],
                [t.total(owner), formatMoney(transfer.total, transfer.sourceCurrency)],
                [t.arrives, t.arrival(transfer.arrivalDays)],
              ]}
            />
          </div>

          <label className="mt-6 block text-sm text-white/70">
            {t.descriptionLabel(owner)}
            <textarea
              rows={3}
              maxLength={MAX_DESCRIPTION}
              value={form.description}
              onChange={set('description')}
              className={`${inputClass} py-3 text-base text-white`}
            />
          </label>
          <p className="mt-2 flex justify-between gap-4 text-sm text-white/50">
            <span>{t.descriptionHint}</span>
            <span className="shrink-0">
              {form.description.length}/{MAX_DESCRIPTION}
            </span>
          </p>
        </>
      )}

      {error && <p className="mt-4 text-red-300">{error}</p>}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {step === 0 && (
          <Button onClick={saveAmount} disabled={busy || !(amount > 0)}>
            {t.next}
          </Button>
        )}
        {step === 1 && (
          <Button onClick={saveRecipient} disabled={busy || !form.name.trim() || !form.iban.trim()}>
            {t.next}
          </Button>
        )}
        {step === 2 && (
          <>
            <Button onClick={submit} disabled={busy || !form.description.trim()}>
              {t.submit}
            </Button>
            <p className="text-center text-sm text-white/50">{t.submitNote(owner)}</p>
          </>
        )}
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={busy}>
            {t.back}
          </Button>
        )}
      </div>
    </Shell>
  )
}
