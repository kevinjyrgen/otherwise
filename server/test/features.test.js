/**
 * Quick tests for the rules of the three "make it easier" features: a bill
 * photo with the request, regular payments, and saved recipients. Run against
 * the real app over HTTP, like rules.test.js: `npm test`.
 */
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, beforeEach, test } from 'node:test'

// Must be set before the server modules are loaded.
process.env.DB_FILE = join(tmpdir(), `guided-transfers-features-test-${process.pid}.json`)
process.env.MOCK_PAYMENT_DELAY_MS = '20'

const { createApp } = await import('../app.js')
const { addDays, nextMonthly } = await import('../dates.js')
const { db, reset } = await import('../store.js')

const IBAN = 'EE382200221020145685'
/** A real, one-pixel PNG. */
const PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
let server
let base

before(async () => {
  server = createApp().httpServer
  await new Promise((done) => server.listen(0, done))
  base = `http://localhost:${server.address().port}/api`
})
after(() => {
  server.close()
  reset() // also removes the photos this run stored
})
beforeEach(() => reset())

/** Calls the API as a user. Returns { status, body, type }. */
async function call(user, method, path, body) {
  const response = await fetch(base + path, {
    method,
    headers: { 'x-user-id': user, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const type = response.headers.get('content-type') ?? ''
  return {
    status: response.status,
    type,
    body: type.includes('json') ? await response.json() : await response.arrayBuffer(),
  }
}
const owner = (method, path, body) => call('tiiu', method, path, body)
const helper = (method, path, body) => call('mari', method, path, body)

/** Demo calendar: 'reminder' = the day before the next regular payment, 'next-day' = one day on. */
const advance = (to) => call('tiiu', 'POST', '/dev/advance', { to })

const kinds = async (who) => (await who('GET', '/notifications')).body.map((n) => n.kind)

/**
 * Owner asks, helper prepares and submits, owner approves and confirms.
 * Returns the owner's view of the result.
 */
async function sentTransfer({ name = 'John Landlord', repeat, request = { note: 'rent' } } = {}) {
  const { body } = await owner('POST', '/owner/transfers', request)
  const saved = await helper('PUT', `/helper/transfers/${body.id}`, {
    sourceAmount: 250,
    targetCurrency: 'EUR',
    recipient: { name, iban: IBAN },
    description: 'Rent to your landlord',
    repeat,
  })
  assert.equal(saved.status, 200)
  assert.equal((await helper('POST', `/helper/transfers/${body.id}/submit`)).status, 200)
  assert.equal((await owner('POST', `/owner/transfers/${body.id}/approve`)).status, 200)
  const done = await owner('POST', `/owner/transfers/${body.id}/confirm`, { iban: IBAN, amount: 250 })
  assert.equal(done.status, 200)
  return done.body
}

// ------------------------------------------------------------- bill photo

test('the owner can send a photo of a bill, and only she and her helper can open it', async () => {
  const { status, body } = await owner('POST', '/owner/transfers', { photo: PHOTO })
  assert.equal(status, 201)
  assert.equal(body.hasPhoto, true)

  const forHelper = await helper('GET', `/helper/transfers/${body.id}/photo`)
  assert.equal(forHelper.status, 200)
  assert.equal(forHelper.type, 'image/png')
  assert.equal((await owner('GET', `/owner/transfers/${body.id}/photo`)).status, 200)
  assert.deepEqual(await kinds(helper), ['TRANSFER_REQUESTED'])

  // Someone who is not part of this transfer finds nothing.
  assert.equal((await call('jaan', 'GET', `/helper/transfers/${body.id}/photo`)).status, 404)
  assert.equal((await call('nobody', 'GET', `/helper/transfers/${body.id}/photo`)).status, 401)
})

test('a photo must really be a picture, and a transfer without one has none', async () => {
  for (const photo of [
    'hello',
    'data:text/html;base64,PGgxPmhpPC9oMT4=',
    // Says PNG, is text.
    'data:image/png;base64,PGgxPmhpPC9oMT4=',
  ]) {
    assert.equal((await owner('POST', '/owner/transfers', { photo })).status, 400)
  }
  assert.equal(db.transfers.length, 0)

  const { body } = await owner('POST', '/owner/transfers', { note: 'rent' })
  assert.equal(body.hasPhoto, false)
  assert.equal((await helper('GET', `/helper/transfers/${body.id}/photo`)).status, 404)
})

// ------------------------------------------------------- regular payments

test('confirming an "every month" transfer sends it and starts a regular payment', async () => {
  const transfer = await sentTransfer({ repeat: { dayOfMonth: 1 } })
  assert.equal(transfer.status, 'SENT')
  assert.equal(db.users.tiiu.balance, 1240.5 - 250.35)

  const { body } = await owner('GET', '/owner/schedules')
  assert.equal(body.length, 1)
  assert.equal(body[0].amount, 250)
  assert.equal(body[0].dayOfMonth, 1)
  assert.equal(body[0].recipient.name, 'John Landlord')
  assert.equal(body[0].preparedBy, 'Mari Tamm')
  assert.equal(body[0].nextDate, nextMonthly(db.clock.processedUntil, 1))
})

test('nothing regular starts before the owner confirms, or when the first payment fails', async () => {
  const { body } = await owner('POST', '/owner/transfers', {})
  const path = `/helper/transfers/${body.id}`
  // Only whole days 1 to 28 are accepted.
  for (const dayOfMonth of [0, 29, 1.5, 'x']) {
    assert.equal((await helper('PUT', path, { repeat: { dayOfMonth } })).status, 400)
  }
  await helper('PUT', path, {
    sourceAmount: 250,
    recipient: { name: 'John Landlord', iban: IBAN },
    description: 'Rent to your landlord',
    repeat: { dayOfMonth: 5 },
  })
  await helper('POST', `${path}/submit`)
  // The owner is shown that it repeats before she decides.
  assert.deepEqual((await owner('GET', `/owner/transfers/${body.id}`)).body.repeat, { dayOfMonth: 5 })
  await owner('POST', `/owner/transfers/${body.id}/approve`)
  assert.equal(db.schedules.length, 0)

  reset()
  const failed = await sentTransfer({ name: 'FAIL Landlord', repeat: { dayOfMonth: 5 } })
  assert.equal(failed.status, 'FAILED')
  assert.equal(db.schedules.length, 0)
})

test('the owner is told the day before, and the payment goes out on the day', async () => {
  await sentTransfer({ repeat: { dayOfMonth: 1 } })
  const due = db.schedules[0].nextDate

  const reminder = await advance('reminder')
  assert.equal(reminder.body.today, addDays(due, -1))
  assert.equal((await kinds(owner))[0], 'REGULAR_TOMORROW')
  assert.equal(db.users.tiiu.balance, 1240.5 - 250.35)

  await advance('next-day')
  assert.equal(db.users.tiiu.balance, 1240.5 - 2 * 250.35)
  const [latest] = (await owner('GET', '/owner/transfers')).body
  assert.equal(latest.status, 'SENT')
  assert.equal(latest.regular, true)
  assert.equal((await owner('GET', '/owner/schedules')).body[0].nextDate, nextMonthly(due, 1))
  // The day is not handled twice.
  await advance('next-day')
  assert.equal(db.users.tiiu.balance, 1240.5 - 2 * 250.35)
})

test('the helper cannot touch a regular payment and does not see the monthly payments', async () => {
  await sentTransfer({ repeat: { dayOfMonth: 1 } })
  const { id } = db.schedules[0]
  const before = await kinds(helper)

  for (const action of ['skip', 'stop']) {
    assert.equal((await helper('POST', `/owner/schedules/${id}/${action}`)).status, 403)
    assert.equal((await helper('POST', `/helper/schedules/${id}/${action}`)).status, 404)
  }
  assert.equal((await helper('GET', '/owner/schedules')).status, 403)
  assert.equal((await helper('GET', '/helper/schedules')).status, 404)

  await advance('reminder')
  await advance('next-day')
  assert.equal(db.transfers.length, 2)
  // She still sees the one transfer she prepared, and hears nothing new.
  assert.equal((await helper('GET', '/helper/transfers')).body.length, 1)
  assert.deepEqual(await kinds(helper), before)
})

test('the owner can skip one payment; the one after goes out again', async () => {
  await sentTransfer({ repeat: { dayOfMonth: 1 } })
  const { id, nextDate: due } = db.schedules[0]
  const skipped = await owner('POST', `/owner/schedules/${id}/skip`, { skip: true })
  assert.equal(skipped.body.skipNext, true)

  await advance('reminder')
  await advance('next-day')
  assert.equal(db.users.tiiu.balance, 1240.5 - 250.35)
  const told = await kinds(owner)
  assert.equal(told[0], 'REGULAR_SKIPPED')
  assert.ok(!told.includes('REGULAR_TOMORROW'))

  const [schedule] = (await owner('GET', '/owner/schedules')).body
  assert.equal(schedule.skipNext, false)
  assert.equal(schedule.nextDate, nextMonthly(due, 1))
  await advance('reminder')
  await advance('next-day')
  assert.equal(db.users.tiiu.balance, 1240.5 - 2 * 250.35)
})

test('the owner can stop a regular payment; removing her helper does not stop it', async () => {
  await sentTransfer({ repeat: { dayOfMonth: 1 } })
  const { id } = db.schedules[0]

  assert.equal((await owner('DELETE', '/owner/helper')).status, 200)
  assert.equal((await owner('GET', '/owner/schedules')).body.length, 1)
  await advance('reminder')
  await advance('next-day')
  assert.equal(db.users.tiiu.balance, 1240.5 - 2 * 250.35)

  assert.equal((await owner('POST', `/owner/schedules/${id}/stop`)).status, 200)
  assert.deepEqual((await owner('GET', '/owner/schedules')).body, [])
  assert.equal((await owner('POST', `/owner/schedules/${id}/skip`)).status, 404)
  assert.equal((await advance('reminder')).status, 409)
  for (let day = 0; day < 40; day++) await advance('next-day')
  assert.equal(db.users.tiiu.balance, 1240.5 - 2 * 250.35)
})

test('a regular payment that cannot be paid fails that month and stays', async () => {
  await sentTransfer({ repeat: { dayOfMonth: 1 } })
  db.users.tiiu.balance = 10
  await advance('reminder')
  await advance('next-day')
  assert.equal(db.users.tiiu.balance, 10)
  assert.equal((await owner('GET', '/owner/transfers')).body[0].status, 'FAILED')
  assert.equal((await kinds(owner))[0], 'FAILED')
  assert.equal((await owner('GET', '/owner/schedules')).body.length, 1)
})

// ------------------------------------------------------- saved recipients

test('a recipient can only be saved by the owner, from a transfer that was sent', async () => {
  const { body: request } = await owner('POST', '/owner/transfers', {})
  await helper('PUT', `/helper/transfers/${request.id}`, {
    sourceAmount: 250,
    recipient: { name: 'John Landlord', iban: IBAN },
    description: 'Rent to your landlord',
  })
  await helper('POST', `/helper/transfers/${request.id}/submit`)
  // Not sent yet: nothing to save.
  assert.equal((await owner('POST', '/owner/recipients', { transferId: request.id })).status, 409)

  const sent = await sentTransfer()
  assert.equal((await helper('POST', '/owner/recipients', { transferId: sent.id })).status, 403)
  assert.equal((await helper('POST', '/helper/recipients', { transferId: sent.id })).status, 404)
  assert.equal((await helper('GET', '/owner/recipients')).status, 403)
  assert.equal((await owner('POST', '/owner/recipients', { transferId: 'nope' })).status, 404)

  const saved = await owner('POST', '/owner/recipients', { transferId: sent.id })
  assert.equal(saved.status, 201)
  assert.equal(saved.body.name, 'John Landlord')
  assert.equal(saved.body.iban, IBAN)
  // Saving the same account again does not make a second one.
  await owner('POST', '/owner/recipients', { transferId: sent.id })
  assert.equal((await owner('GET', '/owner/recipients')).body.length, 1)

  assert.equal((await owner('DELETE', `/owner/recipients/${saved.body.id}`)).status, 200)
  assert.deepEqual((await owner('GET', '/owner/recipients')).body, [])
})

test('the owner pays a saved recipient on her own without typing the account number', async () => {
  const sent = await sentTransfer()
  const { body: saved } = await owner('POST', '/owner/recipients', { transferId: sent.id })
  const balance = db.users.tiiu.balance

  // Step 1 only checks the help setting: nothing is sent yet.
  const check = await owner('POST', '/owner/send', { amount: 30, recipientId: saved.id, checkOnly: true })
  assert.equal(check.body.outcome, 'NEEDS_DETAILS')
  assert.equal(db.users.tiiu.balance, balance)

  const { body } = await owner('POST', '/owner/send', { amount: 30, recipientId: saved.id })
  assert.equal(body.outcome, 'SENT')
  assert.equal(body.transfer.recipient.iban, IBAN)
  assert.equal(db.users.tiiu.balance, Math.round((balance - 30.35) * 100) / 100)
  // Sent on her own: the helper does not see it.
  assert.equal((await helper('GET', '/helper/transfers')).body.length, 1)

  assert.equal((await owner('POST', '/owner/send', { amount: 30, recipientId: 'nope' })).status, 404)
})

test('a saved recipient does not get around the help setting', async () => {
  const sent = await sentTransfer()
  const { body: saved } = await owner('POST', '/owner/recipients', { transferId: sent.id })
  const balance = db.users.tiiu.balance

  // Over her 100 EUR limit: not sent, but handed to the helper with the recipient filled in.
  const { body } = await owner('POST', '/owner/send', { amount: 250, recipientId: saved.id })
  assert.equal(body.outcome, 'HELP_REQUESTED')
  assert.equal(db.users.tiiu.balance, balance)
  const [request] = (await helper('GET', '/helper/transfers')).body
  assert.equal(request.status, 'REQUESTED')
  assert.equal(request.requestedAmount, 250)
  assert.equal(request.recipient.iban, IBAN)
})
