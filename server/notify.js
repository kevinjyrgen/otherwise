/**
 * Notifications: stored per user and pushed live to their windows.
 */
import { randomUUID } from 'node:crypto'
import { emitTo } from './events.js'
import { db, save } from './store.js'

/**
 * Stores a notification for one user and pushes it to their windows.
 * @param {string} userId who gets it
 * @param {string} kind e.g. 'APPROVAL_NEEDED', 'INVITE'
 * @param {object} data what the text needs; must only hold what this user may see
 * @param {string|null} [transferId] the transfer it is about, if any
 */
export function pushNotification(userId, kind, data, transferId = null) {
  const notification = {
    id: randomUUID(),
    userId,
    transferId,
    kind,
    read: false,
    createdAt: new Date().toISOString(),
    data,
  }
  db.notifications.push(notification)
  save()
  emitTo(userId, 'notification', notification)
}
