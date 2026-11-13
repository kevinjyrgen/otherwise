/**
 * Text shared by notifications and result screens: notification sentences per
 * role, and the reasons why a transfer was declined or not sent.
 */

/** Why a transfer did not happen, in plain words, per reader. */
export const reasonText = {
  owner: {
    NOT_RECOGNISED: 'You did not recognise this transfer.',
    WRONG_DETAILS: 'Something in the details looked wrong.',
    CHANGED_MIND: 'You changed your mind.',
    INSUFFICIENT_FUNDS: 'There is not enough money in your account.',
    PAYMENT_REJECTED: 'The bank did not accept the transfer.',
  },
  helper: {
    NOT_RECOGNISED: 'She did not recognise this transfer.',
    WRONG_DETAILS: 'Something in the details looked wrong to her.',
    CHANGED_MIND: 'She changed her mind.',
    // The helper is never told anything about the owner's balance.
    NOT_SENT: 'It could not be sent from her account.',
    PAYMENT_REJECTED: 'The bank did not accept the transfer.',
  },
}

const to = (d) => (d.recipientName ? ` to ${d.recipientName}` : '')
const why = (role, d) => (reasonText[role][d.reason] ? ` ${reasonText[role][d.reason]}` : '')

const sentences = {
  owner: {
    APPROVAL_NEEDED: (d) => `${d.helperName} prepared a transfer for you. Please look at it.`,
    SENT: (d) => `Your transfer${to(d)} was sent.`,
    FAILED: (d) => `Your transfer${to(d)} was not sent.${why('owner', d)}`,
    DECLINED: (d) => `You said no to the transfer${to(d)}. No money was sent.`,
    CANCELLED: (d) => `${d.helperName} cancelled the transfer. No money was sent.`,
  },
  helper: {
    TRANSFER_REQUESTED: (d) =>
      `${d.ownerName} asked you to prepare a transfer.${d.note ? ` “${d.note}”` : ''}`,
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
