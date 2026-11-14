/** All text of the owner's home screen, in one place for translation. */
export default {
  greeting: (name) => `Hello, ${name}`,
  balanceLabel: 'Your money',
  waitingTitle: (helper) => `${helper} prepared a transfer for you`,
  look: 'Look at it',
  askTitle: 'Want to send money?',
  askText: (helper) => `${helper} can fill in the details. You check them and send the money yourself.`,
  ask: 'Prepare it for me',
  askBill: 'I have a bill to pay',
  preparing: (helper) => `${helper} is preparing your transfer. We will tell you when it is ready.`,
  noHelperTitle: 'You do not have a helper yet',
  noHelperText: 'A helper is someone you trust who fills in a transfer for you. You always send the money yourself.',
  addHelper: 'Add a helper',
  seeHelper: 'See your helper invite',
  recentTitle: 'Earlier',
  status: {
    SENT: 'Sent',
    FAILED: 'Not sent',
    DECLINED: 'You said no',
    CANCELLED: 'Cancelled',
  },
  noDescription: 'Transfer',
}
