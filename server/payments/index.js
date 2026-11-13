/**
 * The only door to payments and exchange rates. Everything is mocked for now;
 * the Wise sandbox (milestone 5) plugs in here and nowhere else.
 */
import { mockSendTransfer } from './mock.js'
import { MOCK_RATES, mockQuote } from './rates.mock.js'

/** Currencies the helper can choose for the recipient. */
export const CURRENCIES = Object.keys(MOCK_RATES)

/**
 * Rate, fee and arrival for sending `sourceAmount` EUR.
 * @param {number} sourceAmount
 * @param {string} targetCurrency one of CURRENCIES
 */
export async function getQuote(sourceAmount, targetCurrency) {
  return mockQuote(sourceAmount, targetCurrency)
}

/**
 * Makes the actual transfer.
 * @param {object} transfer an approved transfer
 * @returns {Promise<{id: string, mock: boolean}>}
 * @throws {import('./errors.js').PaymentError}
 */
export async function sendTransfer(transfer) {
  return mockSendTransfer(transfer)
}
