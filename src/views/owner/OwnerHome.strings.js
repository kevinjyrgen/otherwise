/** All text of the owner's home screen, in one place for translation. */
export default {
  greeting: (name) => `Hello, ${name}`,
  balanceLabel: 'Your money',
  waitingTitle: (helper) => `${helper} prepared a transfer for you`,
  look: 'Look at it',
  askTitle: 'Want to send money?',
  askText: (helper) => `${helper} can fill in the details. You check them and send the money yourself.`,
  ask: 'Prepare it for me',
  preparing: (helper) => `${helper} is preparing your transfer. We will tell you when it is ready.`,
  recentTitle: 'Earlier',
  status: {
    SENT: 'Sent',
    FAILED: 'Not sent',
    DECLINED: 'You said no',
    CANCELLED: 'Cancelled',
  },
  noDescription: 'Transfer',
}
