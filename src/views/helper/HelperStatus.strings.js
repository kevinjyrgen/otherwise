/** All text of the helper's status screen (after submitting), in one place for translation. */
import { ordinal } from '../../format.js'

export default {
  title: {
    PENDING_APPROVAL: (owner) => `Waiting for ${owner} to confirm`,
    APPROVED: (owner) => `Waiting for ${owner} to confirm`,
    SENT: () => 'Transfer sent',
    DECLINED: (owner) => `${owner} declined`,
    CANCELLED: () => 'Transfer cancelled',
    FAILED: () => 'Transfer not sent',
  },
  text: {
    PENDING_APPROVAL: (owner) => `${owner} has been notified. Only she can send the money.`,
    APPROVED: (owner) => `${owner} is looking at it now. Only she can send the money.`,
    SENT: (owner) => `${owner} confirmed it and the money is on its way.`,
    DECLINED: () => 'No money was sent.',
    CANCELLED: () => 'No money was sent.',
    FAILED: () => 'No money was sent.',
  },
  description: 'Your description',
  to: 'To',
  iban: 'IBAN',
  amount: 'Amount',
  recipientGets: 'Recipient gets',
  fee: 'Fee',
  reference: 'Reference',
  repeatLabel: 'How often',
  repeat: (dayOfMonth) => `Every month on the ${ordinal(dayOfMonth)}`,
  regularStarted: (owner) =>
    `${owner}'s regular payment has started. Only she can skip a month or stop it.`,
  cancel: 'Cancel transfer',
  cancelQuestion: (owner) => `Cancel this transfer? ${owner} will no longer be able to confirm it.`,
  home: 'Back to overview',
}
