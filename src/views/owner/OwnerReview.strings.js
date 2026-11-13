/** All text of the owner's "check the transfer" screen, in one place for translation. */
export default {
  title: 'Check this transfer',
  preparedBy: (helper) => `${helper} prepared it and wrote:`,
  to: 'Who gets the money',
  iban: 'Their account number (IBAN)',
  amount: 'Amount',
  theyGet: 'They receive',
  fee: 'Fee',
  total: 'Total leaving your account',
  arrives: 'Arrives',
  arrival: (days) => (days === 0 ? 'Today' : 'On the next working day'),
  preparedLabel: 'Prepared by',
  approve: 'Approve',
  decline: 'Decline',
}
