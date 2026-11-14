/** All text of the helper's home screen, in one place for translation. */
export default {
  greeting: (name) => `Hi, ${name}`,
  helping: (owner) => `You prepare transfers for ${owner}. Only she can send them.`,
  todoTitle: 'To prepare',
  todoEmpty: 'Nothing to prepare right now.',
  requested: (owner) => `${owner} asked you to prepare a transfer`,
  requestedAmount: (owner, amount) => `${owner} wants to send ${amount} and asked for your help`,
  requestedBill: (owner) => `${owner} sent you a photo of a bill to pay`,
  requestedTo: (name) => `To ${name}, someone she has paid before`,
  notHelping: 'You are not helping anyone right now.',
  start: 'Start',
  resume: 'Continue',
  otherTitle: 'Prepared by you',
  untitled: 'Transfer',
  status: {
    PENDING_APPROVAL: 'Waiting',
    APPROVED: 'Waiting',
    SENT: 'Sent',
    DECLINED: 'Declined',
    CANCELLED: 'Cancelled',
    FAILED: 'Not sent',
  },
}
