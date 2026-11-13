/**
 * All text and MOCK data of the home page, in one place for translation.
 *
 * Everything here is made up for the demo, with one exception: the owner's
 * EUR balance is the real one from the server, so it drops after a transfer.
 * The helper's page shows only her own mock money, never the owner's.
 */
export default {
  greeting: (name) => `Hi, ${name}`,
  balances: 'Your balances',
  activity: 'Recent activity',
  guidedTransfer: 'Guided transfer',

  promo: {
    owner: {
      title: 'Want a hand with a transfer?',
      text: (helper) => `${helper} can prepare it. You check it and send it yourself.`,
      button: 'Open Guided Transfers',
    },
    helper: {
      title: (owner) => `You help ${owner} with transfers`,
      text: () => 'You prepare them. Only she can send the money.',
      button: 'Open Guided Transfers',
    },
  },

  /** MOCK balances besides the owner's live EUR balance. */
  mockBalances: {
    owner: [{ currency: 'GBP', amount: 85.2 }],
    helper: [
      { currency: 'EUR', amount: 2318.07 },
      { currency: 'USD', amount: 120 },
    ],
  },

  /** MOCK activity rows. Negative amounts are money going out. */
  mockActivity: {
    owner: [
      { title: 'Corner grocery', detail: 'Card payment · 11 Nov', amount: -23.4, currency: 'EUR' },
      { title: 'Pension', detail: 'Received · 5 Nov', amount: 612, currency: 'EUR' },
      { title: 'Electricity bill', detail: 'Direct debit · 3 Nov', amount: -48.9, currency: 'EUR' },
      { title: 'Pharmacy', detail: 'Card payment · 1 Nov', amount: -12.75, currency: 'EUR' },
    ],
    helper: [
      { title: 'Coffee shop', detail: 'Card payment · 12 Nov', amount: -4.2, currency: 'EUR' },
      { title: 'Salary', detail: 'Received · 10 Nov', amount: 1950, currency: 'EUR' },
      { title: 'Kristjan Tamm', detail: 'Sent · 8 Nov', amount: -30, currency: 'EUR' },
      { title: 'Online bookshop', detail: 'Card payment · 6 Nov', amount: -18.99, currency: 'USD' },
    ],
  },
}
