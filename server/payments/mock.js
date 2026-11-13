/**
 * MOCK payment. No money moves and no network call is made.
 */
import { randomUUID } from 'node:crypto'
import { PaymentError } from './errors.js'

/** How long the fake bank takes. Tests shorten it. */
const DELAY_MS = Number(process.env.MOCK_PAYMENT_DELAY_MS ?? 1000)

/**
 * Pretends to send the transfer: waits about a second and returns a fake id.
 * Demo switch: a recipient name containing "FAIL" makes the payment fail.
 * @param {object} transfer
 * @returns {Promise<{id: string, mock: true}>}
 * @throws {PaymentError}
 */
export async function mockSendTransfer(transfer) {
  console.log(
    `[MOCK PAYMENT] sending ${transfer.sourceAmount} ${transfer.sourceCurrency} to ${transfer.recipient.name} (${transfer.recipient.iban}). No real money moves.`,
  )
  await new Promise((done) => setTimeout(done, DELAY_MS))
  if (transfer.recipient.name.toUpperCase().includes('FAIL')) {
    console.log('[MOCK PAYMENT] rejected (recipient name contains "FAIL").')
    throw new PaymentError('PAYMENT_REJECTED')
  }
  const id = `mock-${randomUUID()}`
  console.log(`[MOCK PAYMENT] done, fake id ${id}.`)
  return { id, mock: true }
}
