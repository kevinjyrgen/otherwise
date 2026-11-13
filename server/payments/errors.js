/**
 * A payment that did not go through, with a machine-readable code the client
 * turns into plain words. Codes: INSUFFICIENT_FUNDS, PAYMENT_REJECTED.
 */
export class PaymentError extends Error {
  /** @param {'INSUFFICIENT_FUNDS'|'PAYMENT_REJECTED'} code */
  constructor(code) {
    super(code)
    this.code = code
  }
}
