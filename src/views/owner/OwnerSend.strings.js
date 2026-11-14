/** All text of the owner's basic "Send money" screens, in one place for translation. */
export default {
  // Step 1
  amountTitle: 'How much do you want to send?',
  amountTitleTo: (name) => `How much do you want to send to ${name}?`,
  next: 'Continue',

  // Step 2
  detailsTitle: 'Who gets the money?',
  savedTitle: 'Someone you saved',
  someoneNew: 'Or someone new',
  name: 'Their full name',
  iban: 'Their account number (IBAN)',

  // Step 3
  checkTitle: 'Send this money?',
  to: 'Who gets it',
  account: 'Their account number',
  amount: 'How much',
  send: 'Send',
  sending: 'Sending…',

  // Help needed instead
  helpTitle: (helper) => `${helper} will prepare this for you`,
  helpWhy: (helpMode, threshold) =>
    helpMode === 'EVERY'
      ? 'You asked for help with every transfer.'
      : `You asked for help when a transfer is over ${threshold} EUR.`,
  helpText: (helper) =>
    `Nothing was sent. ${helper} has been asked. We will tell you when it is ready for you to check.`,
  done: 'Done',

  back: 'Go back',
}
