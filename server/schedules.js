/**
 * Regular payments: the same amount to the same person on one day of every
 * month.
 *
 * - A regular payment starts in exactly one way: the helper prepares a
 *   transfer and marks it "every month", and the owner confirms it. Her
 *   confirmation sends the first payment and approves the ones that follow.
 * - From then on it is the owner's alone. The helper cannot change it and
 *   does not see the monthly payments. Only the owner can skip one or stop it.
 * - The day before each payment the owner is told, so she can still skip it.
 *
 * Days come from the demo calendar (`db.clock`): the real date plus the days
 * the demo was moved ahead, so a month can pass during a presentation.
 */
import { randomUUID } from 'node:crypto'
import { addDays, daysBetween, isoDay, nextMonthly } from './dates.js'
import { RuleError } from './errors.js'
import { emitTo } from './events.js'
import { pushNotification } from './notify.js'
import { SCHEDULE } from './seed.js'
import { db, save } from './store.js'
// Note: transfers.js also imports this file. That circle is fine because both
// sides only call each other inside functions, after both modules have loaded.
import { payScheduled } from './transfers.js'

/** Days of the month a regular payment can go out on. Every month has them. */
export const MAX_DAY_OF_MONTH = 28

// ------------------------------------------------------------------ clock

/** Today on the demo calendar. */
export function today() {
  const date = new Date()
  date.setDate(date.getDate() + db.clock.offsetDays)
  return isoDay(date)
}

/** The active regular payments, soonest first. */
const active = () =>
  db.schedules
    .filter((s) => s.status === SCHEDULE.ACTIVE)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))

/** What the /demo page shows: the demo's date and when the next regular payment is. */
export function clockView() {
  return { today: today(), nextPayment: active()[0]?.nextDate ?? null }
}

// ------------------------------------------------------------------ views

/** What a regular payment's notifications need for their text. */
const facts = (schedule) => ({
  recipientName: schedule.recipient.name,
  amount: schedule.amount,
  currency: schedule.sourceCurrency,
})

/** What the owner sees of a regular payment. */
function view(schedule) {
  return {
    id: schedule.id,
    description: schedule.description,
    recipient: { name: schedule.recipient.name, iban: schedule.recipient.iban },
    amount: schedule.amount,
    currency: schedule.sourceCurrency,
    dayOfMonth: schedule.dayOfMonth,
    nextDate: schedule.nextDate,
    skipNext: schedule.skipNext,
    preparedBy: schedule.preparedBy ? db.users[schedule.preparedBy].name : null,
    createdAt: schedule.createdAt,
  }
}

/** The owner's regular payments that are still running, soonest first. */
export function listFor(owner) {
  return active()
    .filter((s) => s.ownerId === owner.id)
    .map(view)
}

// ---------------------------------------------------------------- helpers

/** One running regular payment of this owner. Anything else looks like "not found". */
function mine(owner, id) {
  const schedule = db.schedules.find((s) => s.id === id && s.ownerId === owner.id)
  if (!schedule || schedule.status !== SCHEDULE.ACTIVE) {
    throw new RuleError(404, 'We could not find that regular payment.')
  }
  return schedule
}

/** Saves and tells the owner's windows to refresh. */
function touch(schedule) {
  schedule.updatedAt = new Date().toISOString()
  save()
  emitTo(schedule.ownerId, 'changed')
}

// ------------------------------------------------------------ starting one

/**
 * Called when a transfer marked "every month" was confirmed by the owner and
 * sent: that payment was the first one, the next follows on the chosen day.
 * @param {object} transfer a SENT transfer with `repeat`
 */
export function createFromTransfer(transfer) {
  const now = new Date().toISOString()
  const schedule = {
    id: randomUUID(),
    ownerId: transfer.ownerId,
    status: SCHEDULE.ACTIVE,
    description: transfer.description,
    reference: transfer.reference,
    recipient: { ...transfer.recipient },
    amount: transfer.sourceAmount,
    sourceCurrency: transfer.sourceCurrency,
    targetCurrency: transfer.targetCurrency,
    dayOfMonth: transfer.repeat.dayOfMonth,
    nextDate: nextMonthly(today(), transfer.repeat.dayOfMonth),
    skipNext: false,
    // Kept so the owner can see who set it up. It gives the helper no access.
    preparedBy: transfer.helperId,
    firstTransferId: transfer.id,
    createdAt: now,
    updatedAt: now,
  }
  db.schedules.push(schedule)
  transfer.scheduleId = schedule.id
  touch(schedule)
  return schedule
}

// ---------------------------------------------------------- owner actions

/**
 * The owner skips the next payment, or changes her mind and wants it after
 * all. Only that one payment is affected.
 * @param {boolean} skip
 */
export function setSkipNext(owner, id, skip) {
  const schedule = mine(owner, id)
  schedule.skipNext = Boolean(skip)
  touch(schedule)
  return view(schedule)
}

/** The owner stops a regular payment for good. Nothing more is sent. */
export function stop(owner, id) {
  const schedule = mine(owner, id)
  schedule.status = SCHEDULE.STOPPED
  touch(schedule)
}

// ------------------------------------------------------------ passing time

/** Everything regular payments do on one day. */
async function runDay(day) {
  for (const schedule of active()) {
    // The day before: tell her, unless she already chose to skip it.
    if (schedule.nextDate === addDays(day, 1) && !schedule.skipNext) {
      pushNotification(schedule.ownerId, 'REGULAR_TOMORROW', facts(schedule))
    }
    if (schedule.nextDate > day) continue

    if (schedule.skipNext) {
      schedule.skipNext = false
      pushNotification(schedule.ownerId, 'REGULAR_SKIPPED', facts(schedule))
    } else {
      // Tells her itself whether the money was sent or not.
      await payScheduled(schedule)
    }
    schedule.nextDate = nextMonthly(day, schedule.dayOfMonth)
    touch(schedule)
  }
}

/** One at a time: days must be handled in order, never twice. */
let queue = Promise.resolve()

/**
 * Handles every day that has passed since the last time, in order. Safe to
 * call often: the server does so on start, every minute, and after the demo
 * calendar is moved.
 */
export function catchUp() {
  queue = queue
    .then(async () => {
      const now = today()
      while (db.clock.processedUntil < now) {
        db.clock.processedUntil = addDays(db.clock.processedUntil, 1)
        save()
        await runDay(db.clock.processedUntil)
      }
    })
    .catch((error) => console.error('[regular payments] could not run', error))
  return queue
}

/**
 * Demo only: moves the calendar ahead and lets the days in between happen.
 * @param {'reminder'|'next-day'} to 'reminder' goes to the day before the next
 *   regular payment (when the owner is told about it); 'next-day' goes one day on.
 */
export async function advance(to) {
  await catchUp()
  let days = 1
  if (to === 'reminder') {
    const next = active()[0]
    if (!next) throw new RuleError(409, 'There is no regular payment yet.')
    // Already on or past the reminder day: just go one day on.
    days = Math.max(1, daysBetween(today(), next.nextDate) - 1)
  }
  db.clock.offsetDays += days
  save()
  await catchUp()
  return clockView()
}
