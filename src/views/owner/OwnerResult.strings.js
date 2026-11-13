/** All text of the owner's result screens, in one place for translation. */
export default {
  title: {
    REQUESTED: (helper) => `${helper} is preparing it`,
    DRAFT: (helper) => `${helper} is preparing it`,
    SENT: () => 'The money was sent',
    FAILED: () => 'The money was not sent',
    DECLINED: () => 'You said no',
    CANCELLED: () => 'This transfer was cancelled',
  },
  text: {
    REQUESTED: () => 'We will tell you when it is ready to check.',
    DRAFT: () => 'We will tell you when it is ready to check.',
    SENT: (x) => `${x.amount} is on its way to ${x.recipient}. ${x.helper} has been told.`,
    FAILED: () => 'No money left your account.',
    DECLINED: (x) => `No money was sent. ${x.helper} has been told.`,
    CANCELLED: () => 'No money was sent.',
  },
  /** Same, for a transfer she sent on her own (no helper involved). */
  textDirect: {
    SENT: (x) => `${x.amount} is on its way to ${x.recipient}.`,
  },
  arrives: (days) => (days === 0 ? 'It arrives today.' : 'It arrives on the next working day.'),
  done: 'Done',
}
