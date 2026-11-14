/**
 * Text shared by notifications and result screens: notification sentences per
 * role, and the reasons why a transfer was declined or not sent.
 */
import { formatMoney } from '../format.js'

/** Why a transfer did not happen, in plain words, per reader. */
export const reasonText = {
  owner: {
    NOT_RECOGNISED: 'You did not recognise this transfer.',
    WRONG_DETAILS: 'Something in the details looked wrong.',
    CHANGED_MIND: 'You changed your mind.',
    HELPER_CANCELLED: 'Your helper cancelled it.',
    HELPER_REMOVED: 'It was cancelled because you removed your helper.',
    INSUFFICIENT_FUNDS: 'There is not enough money in your account.',
    PAYMENT_REJECTED: 'The bank did not accept the transfer.',
  },
  helper: {
    NOT_RECOGNISED: 'She did not recognise this transfer.',
    WRONG_DETAILS: 'Something in the details looked wrong to her.',
    CHANGED_MIND: 'She changed her mind.',
    HELPER_CANCELLED: 'You cancelled it.',
    HELPER_REMOVED: 'It was cancelled because you are no longer her helper.',
    // After submitting, the helper is told nothing about the owner's balance.
    NOT_SENT: 'It could not be sent from her account.',
    PAYMENT_REJECTED: 'The bank did not accept the transfer.',
  },
}

const to = (d) => (d.recipientName ? ` to ${d.recipientName}` : '')
/** The monthly payments of a regular payment are called that, not "transfer". */
const what = (d) => (d.regular ? 'regular payment' : 'transfer')
const note = (d) => (d.note ? ` “${d.note}”` : '')
const why = (role, d) => (reasonText[role][d.reason] ? ` ${reasonText[role][d.reason]}` : '')

const sentences = {
  owner: {
    APPROVAL_NEEDED: (d) => `${d.helperName} prepared a transfer for you. Please look at it.`,
    SENT: (d) => `Your ${what(d)}${to(d)} was sent.`,
    FAILED: (d) => `Your ${what(d)}${to(d)} was not sent.${why('owner', d)}`,
    REGULAR_TOMORROW: (d) =>
      `Tomorrow ${formatMoney(d.amount, d.currency)} goes${to(d)}. It is your regular payment. Tap here if you want to skip it.`,
    REGULAR_SKIPPED: (d) => `Your regular payment${to(d)} was skipped this month, as you asked.`,
    DECLINED: (d) => `You said no to the transfer${to(d)}. No money was sent.`,
    CANCELLED: (d) => `${d.helperName} cancelled the transfer. No money was sent.`,
    INVITE_ACCEPTED: (d) => `${d.helperName} said yes and is now your helper.`,
    INVITE_DECLINED: (d) => `${d.helperName} said no to being your helper.`,
  },
  helper: {
    TRANSFER_REQUESTED: (d) =>
      d.hasPhoto
        ? `${d.ownerName} sent you a photo of a bill and asked you to prepare the transfer.${note(d)}`
        : `${d.ownerName} asked you to prepare a transfer${d.requestedAmount ? ` of ${d.requestedAmount} EUR` : ''}${to(d)}.${note(d)}`,
    INVITE: (d) => `${d.ownerName} is asking you to be her helper.`,
    HELPER_REMOVED: (d) => `${d.ownerName} removed you as her helper.`,
    SENT: (d) => `${d.ownerName} confirmed. The transfer${to(d)} was sent.`,
    FAILED: (d) => `The transfer${to(d)} was not sent.${why('helper', d)}`,
    DECLINED: (d) => `${d.ownerName} declined the transfer${to(d)}.${why('helper', d)}`,
  },
}

/**
 * The sentence shown for one notification.
 * @param {'owner'|'helper'} role
 * @param {{kind: string, data: object}} notification
 */
export function notificationText(role, notification) {
  return sentences[role][notification.kind]?.(notification.data) ?? ''
}

export default {
  bell: 'Notifications',
  empty: 'Nothing new.',
  close: 'Close',
}
