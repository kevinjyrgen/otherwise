import Button from '../../components/Button.jsx'
import { reasonText } from '../../components/notifications.strings.js'
import Rows from '../../components/Rows.jsx'
import Shell from '../../components/Shell.jsx'
import { formatIban, formatMoney } from '../../format.js'
import t from './HelperStatus.strings.js'

const WAITING = ['PENDING_APPROVAL', 'APPROVED']

/**
 * Steps 5 and 11 for the helper: the waiting state after submitting, then the
 * outcome. There is no way to send money from here.
 * @param {{transfer: object}} props any transfer that is past DRAFT
 */
export default function HelperStatus({ transfer }) {
  const { status } = transfer
  const owner = transfer.ownerName
  const waiting = WAITING.includes(status)

  return (
    <Shell>
      <div className="mt-6 flex items-center gap-3">
        {waiting && <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-bright-green" />}
        <h1 className="text-2xl font-extrabold tracking-tight">{t.title[status](owner)}</h1>
      </div>
      {reasonText.helper[transfer.reason] && (
        <p className="mt-3 font-semibold">{reasonText.helper[transfer.reason]}</p>
      )}
      <p className="mt-2 text-white/60">{t.text[status](owner)}</p>

      {transfer.sourceAmount && (
        <div className="mt-6 rounded-2xl bg-card px-4">
          <Rows
            rows={[
              [t.description, transfer.description],
              [t.to, transfer.recipient.name],
              [t.iban, formatIban(transfer.recipient.iban)],
              [t.amount, formatMoney(transfer.sourceAmount, transfer.sourceCurrency)],
              [t.recipientGets, formatMoney(transfer.targetAmount, transfer.targetCurrency)],
              [t.fee, formatMoney(transfer.fee, transfer.sourceCurrency)],
            ]}
          />
        </div>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button variant="secondary" to="/helper">
          {t.home}
        </Button>
      </div>
    </Shell>
  )
}
