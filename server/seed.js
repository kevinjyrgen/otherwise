/**
 * Seed data for the demo. There is no real login: these users are the whole
 * world. Pure data only, so both the server and the reset script can import it.
 */
import { isoDay } from './dates.js'

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

/** Statuses of the owner–helper link. INVITED → ACTIVE or DECLINED; REMOVED ends it. */
export const LINK = Object.freeze({
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  DECLINED: 'DECLINED',
  REMOVED: 'REMOVED',
})

/** Statuses of a regular payment. ACTIVE until the owner stops it. */
export const SCHEDULE = Object.freeze({
  ACTIVE: 'ACTIVE',
  STOPPED: 'STOPPED',
})

/**
 * Builds a fresh database.
 * @param {{withHelper?: boolean}} [options] `withHelper: false` starts with no
 *   helper, to demo adding one. The default has Mari already active.
 * @returns {{users: Object, links: Array, transfers: Array, notifications: Array,
 *   recipients: Array, schedules: Array, clock: Object}}
 */
export function seedData({ withHelper = true } = {}) {
  const now = new Date().toISOString()
  return {
    // email, phone and wisetag form the small mock directory the owner searches.
    users: {
      tiiu: {
        id: 'tiiu',
        name: 'Tiiu',
        role: 'owner',
        balance: 1240.5,
        currency: 'EUR',
      },
      mari: {
        id: 'mari',
        name: 'Mari Tamm',
        role: 'helper',
        email: 'mari.tamm@example.com',
        phone: '+372 5550 1234',
        wisetag: '@maritamm',
      },
      jaan: {
        id: 'jaan',
        name: 'Jaan Kask',
        role: 'helper',
        email: 'jaan.kask@example.com',
        phone: '+372 5550 5678',
        wisetag: '@jaankask',
      },
      liis: {
        id: 'liis',
        name: 'Liis Saar',
        role: 'helper',
        email: 'liis.saar@example.com',
        phone: '+372 5550 9012',
        wisetag: '@liissaar',
      },
    },
    // Who helps whom. Shape of a link:
    // { id, ownerId, helperId, status, helpMode: 'EVERY'|'OVER', threshold, createdAt, updatedAt }
    links: withHelper
      ? [
          {
            id: 'seed-link',
            ownerId: 'tiiu',
            helperId: 'mari',
            status: LINK.ACTIVE,
            // Ask for help when a transfer is over 100 EUR.
            helpMode: 'OVER',
            threshold: 100,
            createdAt: now,
            updatedAt: now,
          },
        ]
      : [],
    // Shape of a transfer:
    // { id, status, ownerId, helperId, direct, note, requestedAmount, description,
    //   sourceAmount, sourceCurrency, targetAmount, targetCurrency, rate, fee, total,
    //   recipient: { name, iban, email }, reference, reason, paymentId, createdAt, updatedAt,
    //   photo (file name of the bill the owner sent, or null),
    //   repeat ({ dayOfMonth } if it should become a regular payment, or null),
    //   scheduleId (the regular payment this transfer started or belongs to, or null) }
    transfers: [],
    // { id, userId, transferId, kind, read, createdAt, data }
    notifications: [],
    // People the owner saved after paying them once:
    // { id, ownerId, name, iban, email, createdAt }
    recipients: [],
    // Regular payments the owner approved:
    // { id, ownerId, status, description, reference, recipient, amount, targetCurrency,
    //   dayOfMonth, nextDate, skipNext, preparedBy, firstTransferId, createdAt, updatedAt }
    schedules: [],
    // The demo's calendar. offsetDays is how far the demo has been moved ahead
    // of the real date; processedUntil is the last day regular payments ran for.
    clock: { offsetDays: 0, processedUntil: isoDay() },
  }
}
