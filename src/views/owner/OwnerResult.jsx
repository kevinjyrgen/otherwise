import Button from '../../components/Button.jsx'
import { reasonText } from '../../components/notifications.strings.js'
import Shell from '../../components/Shell.jsx'
import { formatMoney } from '../../format.js'
import StatusIcon from '../../components/StatusIcon.jsx'
import t from './OwnerResult.strings.js'

/**
 * Steps 10–11 for the owner: what happened to the transfer, in plain words.
 * Also covers "still being prepared".
 * @param {{transfer: object}} props
 */
export default function OwnerResult({ transfer }) {
  const { status } = transfer
  const helper = transfer.helperName.split(' ')[0]
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
      <p className="mt-4 text-xl text-white/70">{t.text[status](facts)}</p>
      {status === 'SENT' && (
        <p className="mt-2 text-xl text-white/70">{t.arrives(transfer.arrivalDays)}</p>
      )}

      <div className="mt-auto pt-8">
        <Button size="lg" to="/owner">
          {t.done}
        </Button>
      </div>
    </Shell>
  )
}
