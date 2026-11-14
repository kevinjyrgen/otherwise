/**
 * Saved recipients: people the owner can pay again without typing an account
 * number.
 *
 * One rule keeps this safe: a recipient can only be saved by the owner, and
 * only from a transfer she confirmed herself and that was sent. So every saved
 * account number is one she has already checked and paid. The helper cannot
 * add, change or see the list.
 */
import { randomUUID } from 'node:crypto'
import { RuleError } from './errors.js'
import { emitTo } from './events.js'
import { STATUS } from './seed.js'
import { db, save } from './store.js'

/** What the owner sees of a saved recipient. */
const view = (recipient) => ({
  id: recipient.id,
  name: recipient.name,
  iban: recipient.iban,
  createdAt: recipient.createdAt,
})

/** The owner's saved recipients, by name. */
export function listFor(owner) {
  return db.recipients
    .filter((r) => r.ownerId === owner.id)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(view)
}

/** One saved recipient of this owner. Anything else looks like "not found". */
export function find(owner, id) {
  const recipient = db.recipients.find((r) => r.id === id && r.ownerId === owner.id)
  if (!recipient) throw new RuleError(404, 'We could not find that saved recipient.')
  return recipient
}

/**
 * Saves the person a sent transfer went to. Name and account number are
 * copied from the transfer, never typed. Saving the same account twice gives
 * back the one that is already there.
 */
export function saveFromTransfer(owner, transferId) {
  const transfer = db.transfers.find((t) => t.id === transferId && t.ownerId === owner.id)
  if (!transfer) throw new RuleError(404, 'Transfer not found.')
  if (transfer.status !== STATUS.SENT) {
    throw new RuleError(409, 'You can save a recipient after the money was sent to them.')
  }

  const existing = db.recipients.find(
    (r) => r.ownerId === owner.id && r.iban === transfer.recipient.iban,
  )
  if (existing) return view(existing)

  const recipient = {
    id: randomUUID(),
    ownerId: owner.id,
    ...transfer.recipient,
    createdAt: new Date().toISOString(),
  }
  db.recipients.push(recipient)
  save()
  emitTo(owner.id, 'changed')
  return view(recipient)
}

/** The owner removes a saved recipient. Regular payments to them are not touched. */
export function remove(owner, id) {
  const recipient = find(owner, id)
  db.recipients.splice(db.recipients.indexOf(recipient), 1)
  save()
  emitTo(owner.id, 'changed')
}
