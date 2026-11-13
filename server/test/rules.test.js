/**
 * Quick tests for the server rules, run against the real app over HTTP:
 * `npm test`. Uses a temporary database file and a fast mock payment.
 */
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, beforeEach, test } from 'node:test'

// Must be set before the server modules are loaded.
process.env.DB_FILE = join(tmpdir(), `guided-transfers-test-${process.pid}.json`)
process.env.MOCK_PAYMENT_DELAY_MS = '20'

const { createApp } = await import('../app.js')
const { db, reset } = await import('../store.js')

const IBAN = 'EE382200221020145685'
let server
let base

before(async () => {
  server = createApp().httpServer
  await new Promise((done) => server.listen(0, done))
  base = `http://localhost:${server.address().port}/api`
})
after(() => server.close())
beforeEach(() => reset())

/** Calls the API as a user. Returns { status, body }. */
async function call(user, method, path, body) {
  const response = await fetch(base + path, {
    method,
    headers: { 'x-user-id': user, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: response.status, body: await response.json() }
}
const owner = (method, path, body) => call('valentina', method, path, body)
const helper = (method, path, body) => call('mari', method, path, body)

/** Owner requests, helper fills everything in. Returns the transfer id (status DRAFT). */
async function draft({ amount = 250, name = 'John Landlord' } = {}) {
  const { body } = await owner('POST', '/owner/transfers', { note: 'rent' })
  const saved = await helper('PUT', `/helper/transfers/${body.id}`, {
    sourceAmount: amount,
    targetCurrency: 'EUR',
    recipient: { name, iban: IBAN },
    description: 'Rent for December to your landlord',
  })
  assert.equal(saved.status, 200)
  return body.id
}

/** A transfer waiting for the owner. */
async function pending(options) {
  const id = await draft(options)
  assert.equal((await helper('POST', `/helper/transfers/${id}/submit`)).status, 200)
  return id
}

/** A transfer the owner approved but has not confirmed yet. */
async function approved(options) {
  const id = await pending(options)
  assert.equal((await owner('POST', `/owner/transfers/${id}/approve`)).status, 200)
  return id
}

const confirmBody = { iban: IBAN, amount: 250 }

test('happy path ends in SENT and takes amount + fee from the balance', async () => {
  const id = await approved()
  const { status, body } = await owner('POST', `/owner/transfers/${id}/confirm`, confirmBody)
  assert.equal(status, 200)
  assert.equal(body.status, 'SENT')
  assert.equal(db.users.valentina.balance, 1240.5 - 250.35)
})

test('the helper has no way to approve, decline or confirm', async () => {
  const id = await pending()
  for (const action of ['approve', 'decline', 'confirm', 'send']) {
    // No such route for the helper…
    assert.equal((await helper('POST', `/helper/transfers/${id}/${action}`, confirmBody)).status, 404)
    // …and the owner's routes refuse her.
    assert.equal((await helper('POST', `/owner/transfers/${id}/${action}`, confirmBody)).status, 403)
  }
  assert.equal(db.transfers[0].status, 'PENDING_APPROVAL')
})

test('the owner cannot create or edit the prepared transfer', async () => {
  const id = await draft()
  assert.equal((await owner('PUT', `/helper/transfers/${id}`, { sourceAmount: 1 })).status, 403)
  assert.equal((await owner('POST', `/helper/transfers/${id}/submit`)).status, 403)
  assert.equal((await owner('PUT', `/owner/transfers/${id}`, { sourceAmount: 1 })).status, 404)
})

test('after submitting the helper cannot edit, only cancel', async () => {
  const id = await pending()
  const edit = await helper('PUT', `/helper/transfers/${id}`, { sourceAmount: 999 })
  assert.equal(edit.status, 409)
  assert.equal(db.transfers[0].sourceAmount, 250)
  assert.equal((await helper('POST', `/helper/transfers/${id}/submit`)).status, 409)

  const cancel = await helper('POST', `/helper/transfers/${id}/cancel`)
  assert.equal(cancel.body.status, 'CANCELLED')
  // A cancelled transfer cannot be approved or sent any more.
  assert.equal((await owner('POST', `/owner/transfers/${id}/approve`)).status, 409)
  assert.equal((await owner('POST', `/owner/transfers/${id}/confirm`, confirmBody)).status, 409)
})

test('confirm is rejected when the IBAN or amount differ from the stored transfer', async () => {
  const id = await approved()
  const path = `/owner/transfers/${id}/confirm`
  assert.equal((await owner('POST', path, { iban: IBAN, amount: 251 })).status, 409)
  assert.equal((await owner('POST', path, { iban: 'GB82WEST12345698765432', amount: 250 })).status, 409)
  assert.equal((await owner('POST', path, {})).status, 409)
  assert.equal(db.transfers[0].status, 'APPROVED')
  assert.equal(db.users.valentina.balance, 1240.5)
})

test('confirm needs an approval first', async () => {
  const id = await pending()
  assert.equal((await owner('POST', `/owner/transfers/${id}/confirm`, confirmBody)).status, 409)
  assert.equal(db.transfers[0].status, 'PENDING_APPROVAL')
})

test('a double tap on confirm makes one transfer', async () => {
  const id = await approved()
  const path = `/owner/transfers/${id}/confirm`
  const [first, second] = await Promise.all([
    owner('POST', path, confirmBody),
    owner('POST', path, confirmBody),
  ])
  const third = await owner('POST', path, confirmBody)
  for (const answer of [first, second, third]) {
    assert.equal(answer.status, 200)
    assert.equal(answer.body.status, 'SENT')
  }
  // Money left the account once.
  assert.equal(db.users.valentina.balance, 1240.5 - 250.35)
})

test('the helper never sees the balance or other details of the owner', async () => {
  await pending()
  const me = await helper('GET', '/me')
  const list = await helper('GET', '/helper/transfers')
  const notifications = await helper('GET', '/notifications')
  for (const answer of [me, list, notifications]) {
    assert.doesNotMatch(JSON.stringify(answer.body), /balance|1240/)
  }
  assert.equal((await helper('GET', '/owner/transfers')).status, 403)
})

test('the owner can decline with a reason, and the helper is told', async () => {
  const id = await pending()
  assert.equal((await owner('POST', `/owner/transfers/${id}/decline`, { reason: 'nope' })).status, 400)
  const { body } = await owner('POST', `/owner/transfers/${id}/decline`, { reason: 'WRONG_DETAILS' })
  assert.equal(body.status, 'DECLINED')
  assert.equal((await owner('POST', `/owner/transfers/${id}/confirm`, confirmBody)).status, 409)

  const notifications = (await helper('GET', '/notifications')).body
  assert.equal(notifications[0].kind, 'DECLINED')
  assert.equal(notifications[0].data.reason, 'WRONG_DETAILS')
})

test('a rejected payment ends in FAILED and no money leaves', async () => {
  const id = await approved({ name: 'Fail Landlord' })
  const { body } = await owner('POST', `/owner/transfers/${id}/confirm`, confirmBody)
  assert.equal(body.status, 'FAILED')
  assert.equal(body.reason, 'PAYMENT_REJECTED')
  assert.equal(db.users.valentina.balance, 1240.5)
  assert.equal((await helper('GET', '/notifications')).body[0].kind, 'FAILED')
})

test('not enough money fails, and the helper is not told why', async () => {
  const id = await approved({ amount: 5000 })
  const { body } = await owner('POST', `/owner/transfers/${id}/confirm`, { iban: IBAN, amount: 5000 })
  assert.equal(body.status, 'FAILED')
  assert.equal(body.reason, 'INSUFFICIENT_FUNDS')
  assert.equal((await helper('GET', `/helper/transfers/${id}`)).body.reason, 'NOT_SENT')
  assert.equal((await helper('GET', '/notifications')).body[0].data.reason, 'NOT_SENT')
})

test('unknown users are turned away', async () => {
  assert.equal((await call('mallory', 'GET', '/owner/transfers')).status, 401)
})
