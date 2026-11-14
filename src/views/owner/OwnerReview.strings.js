/** All text of the owner's "check the transfer" screen, in one place for translation. */
import { everyMonth } from './OwnerPayments.strings.js'

export default {
  title: 'Check this transfer',
  preparedBy: (helper) => `${helper} prepared it and wrote:`,
  to: 'Who gets the money',
  iban: 'Their account number (IBAN)',
  reference: 'Reference number',
  photoTitle: 'The bill you sent',
  photoText: 'Compare it with the details below.',
  repeatTitle: 'This is a regular payment',
  repeatText: (dayOfMonth) =>
    `This one is sent when you confirm. After that the same amount goes out ${everyMonth(dayOfMonth)}.`,
  repeatControl: 'We tell you the day before. You can skip a month or stop it at any time.',
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
