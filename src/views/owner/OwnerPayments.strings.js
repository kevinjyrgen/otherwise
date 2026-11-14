/** All text of the owner's "Payments" page (regular payments), in one place for translation. */
import { formatDay, ordinal } from '../../format.js'

/** "every month on the 1st": shared by every screen that mentions a regular payment. */
export const everyMonth = (dayOfMonth) => `every month on the ${ordinal(dayOfMonth)}`

export default {
  title: 'Regular payments',
  text: 'These go out by themselves every month. We tell you the day before.',
  emptyTitle: 'No regular payments',
  emptyText: (helper) =>
    helper
      ? `${helper} can set one up for you, for example for your rent. You approve it once. After that you can skip a month or stop it at any time.`
      : 'A helper can set one up for you, for example for your rent. You approve it once. After that you can skip a month or stop it at any time.',

  to: (amount, name) => `${amount} to ${name}`,
  when: (dayOfMonth) => `Goes out ${everyMonth(dayOfMonth)}`,
  next: (day) => `Next one: ${formatDay(day)}`,
  skipped: (day) => `The one on ${formatDay(day)} will be skipped. No money goes out that day.`,
  preparedBy: (helper) => `Set up by ${helper}, approved by you`,
  skip: 'Skip the next one',
  unskip: 'Pay it after all',
  stop: 'Stop this payment',

  // Confirmation before stopping
  stopQuestion: (name) => `Stop paying ${name} every month?`,
  stopText: 'No more money will be sent for this. Money that was already sent stays sent.',
  yesStop: 'Yes, stop it',
  no: 'No, keep it',
}
