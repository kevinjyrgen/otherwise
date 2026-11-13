/**
 * Seed data for the demo. There is no real login: these two users are the
 * whole world. Pure data only, so both the server and the reset script can
 * import it.
 */

/** Transfer statuses. REQUESTED → DRAFT → PENDING_APPROVAL → APPROVED → SENT, plus the three end states. */
export const STATUS = Object.freeze({
  REQUESTED: 'REQUESTED',
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  SENT: 'SENT',
  DECLINED: 'DECLINED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
})

/**
 * Builds a fresh database.
 * @returns {{users: Object, transfers: Array, notifications: Array}}
 */
export function seedData() {
  return {
    users: {
      valentina: {
        id: 'valentina',
        name: 'Valentina',
        role: 'owner',
        balance: 1240.5,
        currency: 'EUR',
        helperId: 'mari',
      },
      mari: {
        id: 'mari',
        name: 'Mari Tamm',
        role: 'helper',
        ownerId: 'valentina',
      },
    },
    // Filled from milestone 2 on. Shape of a transfer:
    // { id, status, ownerId, helperId, note, description,
    //   sourceAmount, sourceCurrency, targetAmount, targetCurrency, rate, fee,
    //   recipient: { name, iban, email }, failureReason, createdAt, updatedAt }
    transfers: [],
    // { id, userId, transferId, kind, read, createdAt }
    notifications: [],
  }
}
