/** All text of the role picker, in one place for translation. */
export default {
  title: 'Who is using this window?',
  subtitle: 'Demo only. Both people already have an account.',
  ownerName: 'Tiiu',
  ownerRole: 'Account owner',
  helperName: 'Mari Tamm',
  helperRole: 'Trusted helper',
  resetTitle: 'Reset the demo',
  resetNoHelper: 'Reset: no helper yet',
  resetNoHelperHint: 'To show adding a helper.',
  resetWithHelper: 'Reset: Mari already added',
  resetWithHelperHint: 'To show a transfer.',
  resetDone: 'Done. The demo was reset.',
  resetFailed: 'Could not reset. Is the server running?',

  // The demo's calendar, to show a regular payment without waiting a month.
  clockTitle: 'Regular payments: move the date',
  clockToday: (day) => `In the demo it is ${day}`,
  clockNext: (day) => `The next regular payment is on ${day}.`,
  clockNone: 'There is no regular payment yet.',
  clockReminder: 'Jump to the day before the next payment',
  clockReminderHint: 'Tiiu is told it goes out tomorrow and can still skip it.',
  clockNextDay: 'Go to the next day',
  clockNextDayHint: 'On the payment day the money goes out.',
  clockFailed: 'Could not move the date. Is the server running?',
}
