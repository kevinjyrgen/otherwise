/**
 * The transfer rules. Every change to a transfer goes through this file, so
 * this is where "who may do what, and when" is enforced.
 *
 * REQUESTED → DRAFT → PENDING_APPROVAL → APPROVED → SENT
 * plus DECLINED, CANCELLED, FAILED.
 *
 * Two kinds of transfer live here:
 * - guided: the owner's helper prepares it, the owner confirms it;
 * - direct: the owner sends it on her own (`direct: true`, no helper). The
 *   helper never sees these. The monthly payments of a regular payment are
 *   direct too: the owner approved them when she confirmed the first one.
 *
 * Three things make a transfer easier, all optional:
 * - `photo`: the owner sent a photo of a bill instead of explaining it;
 * - `repeat`: the helper marked it "every month", so confirming it also
 *   starts a regular payment (see schedules.js);
 * - a saved recipient: the owner picked someone she paid before (recipients.js).
 */
import { randomUUID } from 'node:crypto'
import { RuleError } from './errors.js'
import { emitTo } from './events.js'
import { activeLink, isActiveHelper, needsHelp } from './links.js'
import { pushNotification } from './notify.js'
import { photoPath, savePhoto } from './photos.js'
import * as recipients from './recipients.js'
import { createFromTransfer, MAX_DAY_OF_MONTH } from './schedules.js'
import { PaymentError } from './payments/errors.js'
import { CURRENCIES, getQuote, sendTransfer } from './payments/index.js'
import { round2, SOURCE_CURRENCY } from './payments/rates.mock.js'
import { STATUS } from './seed.js'
import { db, save } from './store.js'

export { RuleError }

const MAX_AMOUNT = 1_000_000
const MAX_DESCRIPTION = 120
const MAX_NOTE = 140
const MAX_NAME = 70
const MAX_REFERENCE = 35

/** Statuses in which the transfer is still the helper's to fill in. */
const UNSUBMITTED = [STATUS.REQUESTED, STATUS.DRAFT]

/** Reasons the owner can pick when she declines. The client turns them into words. */
export const DECLINE_REASONS = ['NOT_RECOGNISED', 'WRONG_DETAILS', 'CHANGED_MIND']

/** Confirms that are being paid right now: transfer id → promise. */
const inFlight = new Map()

// ---------------------------------------------------------------- helpers

/** Removes spaces and upper-cases, so "ee38 2200…" equals "EE382200…". */
export const normalizeIban = (iban) => String(iban ?? '').replace(/\s+/g, '').toUpperCase()

/** Format check plus the standard mod-97 checksum, to catch typos. */
function isValidIban(iban) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false
  // Move the first four characters to the end, turn letters into numbers (A=10 … Z=35).
  const digits = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, (c) => c.charCodeAt(0) - 55)
  return BigInt(digits) % 97n === 1n
}

/**
 * Finds a transfer that belongs to this user. Anything else looks like "not
 * found". Direct transfers have no helper, so a helper can never reach them.
 */
function mine(user, id) {
  const transfer = db.transfers.find((t) => t.id === id)
  const key = user.role === 'owner' ? 'ownerId' : 'helperId'
  if (!transfer || transfer[key] !== user.id) throw new RuleError(404, 'Transfer not found.')
  return transfer
}

/** Rejects the action unless the transfer is in one of the allowed statuses. */
function requireStatus(transfer, allowed, message) {
  if (!allowed.includes(transfer.status)) throw new RuleError(409, message)
}

/** Once the owner has confirmed and the payment is on its way, nobody can stop it. */
function requireNotSending(transfer) {
  if (inFlight.has(transfer.id)) throw new RuleError(409, 'This transfer is being sent right now.')
}

/** Preparing is only allowed while the helper's link to the owner is ACTIVE. */
function requireActiveHelper(transfer) {
  if (!isActiveHelper(transfer.ownerId, transfer.helperId)) {
    throw new RuleError(403, `You are not ${db.users[transfer.ownerId].name}'s helper.`)
  }
}

/** Moves the transfer to a status, saves, and tells both people's windows to refresh. */
function setStatus(transfer, status) {
  transfer.status = status
  transfer.updatedAt = new Date().toISOString()
  save()
  emitTo(transfer.ownerId, 'changed')
  if (transfer.helperId) emitTo(transfer.helperId, 'changed')
}

/** Notifies one user about a transfer, with only what that user may see of it. */
function notify(userId, kind, transfer) {
  const view = viewFor(db.users[userId], transfer)
  pushNotification(
    userId,
    kind,
    {
      ownerName: view.ownerName,
      helperName: view.helperName,
      note: view.note,
      requestedAmount: view.requestedAmount,
      description: view.description,
      recipientName: view.recipient?.name,
      reason: view.reason,
      hasPhoto: view.hasPhoto,
      regular: view.regular,
    },
    transfer.id,
  )
}

/** Tells the owner, and the helper if there is one. */
function notifyBoth(kind, transfer) {
  notify(transfer.ownerId, kind, transfer)
  if (transfer.helperId) notify(transfer.helperId, kind, transfer)
}

/** Copies a fresh quote (rate, fee, totals, arrival) onto the transfer. */
async function applyQuote(transfer) {
  const quote = await getQuote(transfer.sourceAmount, transfer.targetCurrency)
  Object.assign(transfer, {
    rate: quote.rate,
    fee: quote.fee,
    targetAmount: quote.targetAmount,
    total: quote.total,
    arrivalDays: quote.arrivalDays,
    quoteIsMock: quote.mock,
  })
}

/** Validates an amount of money. */
function readAmount(value) {
  const amount = round2(Number(value))
  if (!(amount > 0) || amount > MAX_AMOUNT) {
    throw new RuleError(400, 'Enter an amount between 0.01 and 1,000,000.')
  }
  return amount
}

/** Validates who gets the money. */
function readRecipient(recipient) {
  const name = String(recipient.name ?? '').trim()
  const iban = normalizeIban(recipient.iban)
  const email = String(recipient.email ?? '').trim()
  if (!name || name.length > MAX_NAME) throw new RuleError(400, "Enter the recipient's full name.")
  if (!isValidIban(iban)) throw new RuleError(400, 'This IBAN does not look right. Check it for typos.')
  if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new RuleError(400, 'This email does not look right.')
  return { name, iban, email }
}

/**
 * Validates the fields the helper sent. Only fields that are present are
 * checked, so a draft can be saved step by step.
 */
function readDraftFields(body) {
  const fields = {}

  if (body.sourceAmount !== undefined && body.sourceAmount !== null && body.sourceAmount !== '') {
    fields.sourceAmount = readAmount(body.sourceAmount)
  }

  if (body.targetCurrency !== undefined) {
    if (!CURRENCIES.includes(body.targetCurrency)) {
      throw new RuleError(400, 'Choose one of the listed currencies.')
    }
    fields.targetCurrency = body.targetCurrency
  }

  if (body.recipient) fields.recipient = readRecipient(body.recipient)

  if (body.description !== undefined) {
    const description = String(body.description).trim()
    if (description.length > MAX_DESCRIPTION) {
      throw new RuleError(400, `Keep the description under ${MAX_DESCRIPTION} characters.`)
    }
    fields.description = description
  }

  if (body.reference !== undefined) {
    const reference = String(body.reference ?? '').trim()
    if (reference.length > MAX_REFERENCE) {
      throw new RuleError(400, `Keep the reference number under ${MAX_REFERENCE} characters.`)
    }
    fields.reference = reference
  }

  // null = just this once; { dayOfMonth } = and then every month on that day.
  if (body.repeat !== undefined) {
    if (body.repeat === null) {
      fields.repeat = null
    } else {
      const dayOfMonth = Number(body.repeat?.dayOfMonth)
      if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > MAX_DAY_OF_MONTH) {
        throw new RuleError(400, `Choose a day of the month between 1 and ${MAX_DAY_OF_MONTH}.`)
      }
      fields.repeat = { dayOfMonth }
    }
  }

  return fields
}

/** A new, empty transfer for this owner. */
function blankTransfer(owner, extra) {
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    status: STATUS.REQUESTED,
    ownerId: owner.id,
    helperId: null,
    direct: false,
    note: '',
    requestedAmount: null,
    description: '',
    recipient: { name: '', iban: '', email: '' },
    reference: '',
    photo: null,
    repeat: null,
    scheduleId: null,
    sourceAmount: null,
    sourceCurrency: SOURCE_CURRENCY,
    targetCurrency: SOURCE_CURRENCY,
    targetAmount: null,
    rate: null,
    fee: null,
    total: null,
    arrivalDays: null,
    quoteIsMock: null,
    reason: null,
    paymentId: null,
    createdAt: now,
    updatedAt: now,
    ...extra,
  }
}

// ------------------------------------------------------------------ views

/**
 * What one user may see of a transfer.
 * - The owner does not see a half-filled draft, only that it is being prepared.
 * - The helper learns nothing about the owner's balance from a failure: one
 *   caused by it is shown to her as a generic NOT_SENT.
 */
export function viewFor(user, transfer) {
  const base = {
    id: transfer.id,
    status: transfer.status,
    direct: transfer.direct,
    note: transfer.note,
    requestedAmount: transfer.requestedAmount,
    ownerName: db.users[transfer.ownerId].name,
    helperName: transfer.helperId ? db.users[transfer.helperId].name : null,
    // The photo itself is fetched separately, see photoFor().
    hasPhoto: Boolean(transfer.photo),
    // True for the monthly payments of a regular payment (not for the first one).
    regular: transfer.direct && Boolean(transfer.scheduleId),
    createdAt: transfer.createdAt,
    updatedAt: transfer.updatedAt,
  }
  const isOwner = user.role === 'owner'
  if (isOwner && UNSUBMITTED.includes(transfer.status)) return base

  return {
    ...base,
    description: transfer.description,
    recipient: transfer.recipient,
    reference: transfer.reference,
    repeat: transfer.repeat,
    sourceAmount: transfer.sourceAmount,
    sourceCurrency: transfer.sourceCurrency,
    targetAmount: transfer.targetAmount,
    targetCurrency: transfer.targetCurrency,
    rate: transfer.rate,
    fee: transfer.fee,
    total: transfer.total,
    arrivalDays: transfer.arrivalDays,
    quoteIsMock: transfer.quoteIsMock,
    reason: !isOwner && transfer.reason === 'INSUFFICIENT_FUNDS' ? 'NOT_SENT' : transfer.reason,
  }
}

/**
 * All transfers of this user, newest first. For a helper that means the ones
 * she prepared: the owner's direct transfers are never in her list.
 */
export function listFor(user) {
  const key = user.role === 'owner' ? 'ownerId' : 'helperId'
  return db.transfers
    .filter((t) => t[key] === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((t) => viewFor(user, t))
}

/** One transfer of this user. */
export function getFor(user, id) {
  return viewFor(user, mine(user, id))
}

/**
 * The bill photo of a transfer, as a file path. Only the two people of that
 * transfer can reach it: the owner who sent it and the helper she asked.
 */
export function photoFor(user, id) {
  const transfer = mine(user, id)
  if (!transfer.photo) throw new RuleError(404, 'This transfer has no photo.')
  return photoPath(transfer.photo)
}

// ---------------------------------------------------------- owner actions

/**
 * Step 1: the owner asks her helper to prepare a transfer. Needs an ACTIVE
 * helper; an invited or declined one does not count.
 * @param {object} owner
 * @param {object} [request]
 * @param {string} [request.note] optional line for the helper
 * @param {string} [request.photo] optional photo of a bill, as a data URL
 * @param {number|null} [request.requestedAmount] set when the request came from "Send money"
 * @param {{name: string, iban: string, email: string}} [request.recipient] set when she
 *   picked a saved recipient in "Send money": filled in for the helper to check
 */
export function createRequest(owner, { note, photo, requestedAmount = null, recipient } = {}) {
  const link = activeLink(owner.id)
  if (!link) throw new RuleError(409, 'You do not have a helper yet. Add a helper first.')

  const transfer = blankTransfer(owner, {
    helperId: link.helperId,
    note: String(note ?? '').trim().slice(0, MAX_NOTE),
    requestedAmount,
    photo: photo ? savePhoto(photo) : null,
    ...(recipient && { recipient }),
  })
  db.transfers.push(transfer)
  setStatus(transfer, STATUS.REQUESTED)
  notify(transfer.helperId, 'TRANSFER_REQUESTED', transfer)
  return transfer
}

/**
 * "Send money": the owner sends on her own, unless her help setting says this
 * amount should go to her helper. Then nothing is sent and it becomes a help
 * request instead.
 *
 * Works in two calls so she is not asked for details she will not need:
 * 1. amount only → HELP_REQUESTED (request created) or NEEDS_DETAILS;
 * 2. amount + recipient → the direct transfer is sent (SENT or FAILED).
 * The help rule is checked on every call, so it cannot be skipped.
 *
 * The recipient is either typed (`recipient`) or one she saved earlier
 * (`recipientId`). A saved recipient does not get around the help rule: over
 * her limit it still goes to her helper, with the recipient already filled in.
 * With a saved recipient the first call says `checkOnly`, so nothing is sent
 * before she has seen the check screen.
 * @returns {Promise<{outcome: 'HELP_REQUESTED'|'NEEDS_DETAILS'|'SENT'|'FAILED', transfer?: object}>}
 */
export async function sendMoney(owner, body) {
  const amount = readAmount(body.amount)
  const saved = body.recipientId ? recipients.find(owner, body.recipientId) : null
  const recipient = saved && { name: saved.name, iban: saved.iban, email: saved.email }

  if (needsHelp(owner.id, amount)) {
    const request = createRequest(owner, { requestedAmount: amount, recipient })
    return { outcome: 'HELP_REQUESTED', transfer: request }
  }
  if (body.checkOnly || (!recipient && !body.recipient)) return { outcome: 'NEEDS_DETAILS' }

  const transfer = blankTransfer(owner, {
    direct: true,
    status: STATUS.APPROVED,
    sourceAmount: amount,
    recipient: recipient ?? readRecipient(body.recipient),
  })
  await applyQuote(transfer)
  db.transfers.push(transfer)
  await pay(transfer)
  return { outcome: transfer.status, transfer }
}

/** Step 8: the owner says yes to the details. Nothing is sent yet. */
export function approve(owner, id) {
  const transfer = mine(owner, id)
  // Approving twice is harmless (she may go back and tap it again).
  if (transfer.status === STATUS.APPROVED) return transfer
  requireStatus(transfer, [STATUS.PENDING_APPROVAL], 'This transfer is not waiting for your answer.')
  setStatus(transfer, STATUS.APPROVED)
  return transfer
}

/** Step 8: the owner says no, with one of the fixed reasons. Nothing is sent. */
export function decline(owner, id, reason) {
  const transfer = mine(owner, id)
  requireStatus(
    transfer,
    [STATUS.PENDING_APPROVAL, STATUS.APPROVED],
    'This transfer is not waiting for your answer.',
  )
  requireNotSending(transfer)
  if (!DECLINE_REASONS.includes(reason)) throw new RuleError(400, 'Choose a reason.')
  transfer.reason = reason
  setStatus(transfer, STATUS.DECLINED)
  notifyBoth('DECLINED', transfer)
  return transfer
}

/**
 * Steps 9–10: the owner's final confirmation.
 * - Bound to what she saw: the request repeats the IBAN and amount, and it is
 *   rejected if they differ from the stored transfer.
 * - Idempotent: a second confirm joins the payment in progress or returns the
 *   finished result. It never starts a second payment.
 */
export function confirm(owner, id, body) {
  const transfer = mine(owner, id)
  if (
    normalizeIban(body.iban) !== transfer.recipient.iban ||
    Number(body.amount) !== transfer.sourceAmount
  ) {
    throw new RuleError(409, 'These are not the details you saw. Please look at the transfer again.')
  }
  if ([STATUS.SENT, STATUS.FAILED].includes(transfer.status)) return transfer
  if (inFlight.has(id)) return inFlight.get(id)
  requireStatus(transfer, [STATUS.APPROVED], 'This transfer cannot be sent.')

  const payment = pay(transfer).finally(() => inFlight.delete(id))
  inFlight.set(id, payment)
  return payment
}

/** Sends the money and records the outcome. Always resolves with the transfer. */
async function pay(transfer) {
  const owner = db.users[transfer.ownerId]
  try {
    if (transfer.total > owner.balance) throw new PaymentError('INSUFFICIENT_FUNDS')
    const result = await sendTransfer(transfer)
    owner.balance = round2(owner.balance - transfer.total)
    transfer.paymentId = result.id
    // Her confirmation of an "every month" transfer also starts the regular payment.
    if (transfer.repeat && !transfer.scheduleId) createFromTransfer(transfer)
    setStatus(transfer, STATUS.SENT)
    notifyBoth('SENT', transfer)
  } catch (error) {
    if (!(error instanceof PaymentError)) console.error('[payment] unexpected error', error)
    transfer.reason = error instanceof PaymentError ? error.code : 'PAYMENT_REJECTED'
    setStatus(transfer, STATUS.FAILED)
    notifyBoth('FAILED', transfer)
  }
  return transfer
}

/**
 * One monthly payment of a regular payment. The owner approved it when she
 * confirmed the first one, so it is sent without asking again. It is hers
 * alone: no helper is attached, so no helper sees it.
 * @param {object} schedule see schedules.js
 * @returns {Promise<object>} the transfer, SENT or FAILED
 */
export async function payScheduled(schedule) {
  const transfer = blankTransfer(db.users[schedule.ownerId], {
    direct: true,
    status: STATUS.APPROVED,
    scheduleId: schedule.id,
    description: schedule.description,
    reference: schedule.reference,
    recipient: { ...schedule.recipient },
    sourceAmount: schedule.amount,
    targetCurrency: schedule.targetCurrency,
  })
  await applyQuote(transfer)
  db.transfers.push(transfer)
  return pay(transfer)
}

// --------------------------------------------------------- helper actions

/** Steps 3–4: the helper fills in or changes the transfer. Only before submitting. */
export async function saveDraft(helper, id, body) {
  const transfer = mine(helper, id)
  requireActiveHelper(transfer)
  requireStatus(
    transfer,
    UNSUBMITTED,
    'This transfer was already sent for approval and can no longer be changed.',
  )
  Object.assign(transfer, readDraftFields(body))
  if (transfer.sourceAmount) await applyQuote(transfer)
  setStatus(transfer, STATUS.DRAFT)
  return transfer
}

/** Step 5: the helper hands the finished transfer to the owner. */
export async function submit(helper, id) {
  const transfer = mine(helper, id)
  requireActiveHelper(transfer)
  requireStatus(transfer, [STATUS.DRAFT], 'This transfer cannot be sent for approval.')
  if (!transfer.sourceAmount) throw new RuleError(400, 'Enter an amount first.')
  if (!transfer.recipient.iban) throw new RuleError(400, "Enter the recipient's details first.")
  if (!transfer.description) throw new RuleError(400, 'Write a short description first.')
  await applyQuote(transfer)
  setStatus(transfer, STATUS.PENDING_APPROVAL)
  notify(transfer.ownerId, 'APPROVAL_NEEDED', transfer)
  return transfer
}

/**
 * The helper withdraws the transfer. This is the only thing she can still do
 * after submitting, and only until the owner has confirmed.
 */
export function cancel(helper, id) {
  const transfer = mine(helper, id)
  requireStatus(
    transfer,
    [...UNSUBMITTED, STATUS.PENDING_APPROVAL, STATUS.APPROVED],
    'This transfer can no longer be cancelled.',
  )
  requireNotSending(transfer)
  transfer.reason = 'HELPER_CANCELLED'
  setStatus(transfer, STATUS.CANCELLED)
  notify(transfer.ownerId, 'CANCELLED', transfer)
  return transfer
}

/**
 * The owner's balance, for the helper. Allowed only while she is the active
 * helper AND is preparing this transfer the owner asked for (not yet
 * submitted). In every other moment the answer is 403.
 */
export function balanceFor(helper, id) {
  const transfer = mine(helper, id)
  if (!UNSUBMITTED.includes(transfer.status) || !isActiveHelper(transfer.ownerId, helper.id)) {
    throw new RuleError(403, 'You can only see the balance while preparing a transfer.')
  }
  const owner = db.users[transfer.ownerId]
  return { balance: owner.balance, currency: owner.currency }
}

// ------------------------------------------------------- link bookkeeping

/**
 * Called when the owner removes her helper: every transfer that helper had
 * not submitted yet is cancelled. Submitted ones stay with the owner to decide.
 * @param {{ownerId: string, helperId: string}} link the removed link
 */
export function cancelUnsubmitted(link) {
  db.transfers
    .filter(
      (t) =>
        t.ownerId === link.ownerId &&
        t.helperId === link.helperId &&
        UNSUBMITTED.includes(t.status),
    )
    .forEach((transfer) => {
      transfer.reason = 'HELPER_REMOVED'
      setStatus(transfer, STATUS.CANCELLED)
    })
}
