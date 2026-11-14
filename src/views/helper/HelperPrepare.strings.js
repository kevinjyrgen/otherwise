/** All text of the helper's "prepare a transfer" form, in one place for translation. */
export default {
  steps: ['Amount', 'Recipient', 'Review'],
  note: (owner) => `${owner}'s note`,
  photo: (owner) => `${owner} sent this photo of the bill. Read the details from it.`,

  // Step 1
  amountTitle: 'How much should be sent?',
  youSend: (owner) => `${owner} sends`,
  recipientGets: 'Recipient gets',
  rate: 'Rate',
  fee: 'Fee',
  total: (owner) => `Total from ${owner}'s account`,
  mockRate: 'Demo rate',
  balance: (owner, amount) => `${owner} has ${amount}. You only see this while preparing this transfer.`,
  tooMuch: (owner) => `This is more than ${owner} has.`,

  // Step 2
  recipientTitle: 'Who is it going to?',
  name: 'Full name of the account holder',
  iban: 'IBAN',
  email: 'Their email (optional)',
  reference: 'Reference number on the bill (optional)',
  referenceShort: 'Reference',

  // Step 3
  reviewTitle: 'Review and describe',
  to: 'To',
  amount: 'Amount',
  arrives: 'Arrives',
  arrival: (days) => (days === 0 ? 'Today' : 'Next working day'),
  descriptionLabel: (owner) => `Describe it for ${owner}`,
  descriptionHint: "Write it the way you'd say it to her, e.g. 'Rent for December to your landlord'",
  repeatLabel: 'How often should it be paid?',
  repeat: { ONCE: 'Just this once', MONTH: 'Every month' },
  repeatDay: 'Day of the month',
  repeatHint: (owner) =>
    `The first payment is sent when ${owner} confirms, then the same amount goes out on this day every month. ${owner} approves this once. Only she can skip a month or stop it.`,
  submit: 'Send for approval',
  submitNote: (owner) => `You cannot send the money. ${owner} checks it and confirms it herself.`,

  cancel: 'Cancel this transfer',
  cancelQuestion: (owner) => `Cancel this transfer? ${owner} will be told.`,
  next: 'Continue',
  back: 'Back',
}
