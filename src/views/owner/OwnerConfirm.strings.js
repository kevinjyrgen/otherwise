/** All text of the owner's final confirmation, in one place for translation. */
import { everyMonth } from './OwnerPayments.strings.js'

export default {
  title: 'Send this money?',
  what: 'What it is for',
  to: 'Who gets it',
  amount: 'How much',
  howOften: 'How often',
  repeats: (dayOfMonth) => `Now, and then ${everyMonth(dayOfMonth)}`,
  confirm: 'Confirm and send',
  sending: 'Sending…',
  back: 'Go back',
}
