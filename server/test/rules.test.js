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
const owner = (method, path, body) => call('tiiu', method, path, body)
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
  assert.equal(db.users.tiiu.balance, 1240.5 - 250.35)
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
  assert.equal(db.users.tiiu.balance, 1240.5)
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
  assert.equal(db.users.tiiu.balance, 1240.5 - 250.35)
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
  assert.equal(db.users.tiiu.balance, 1240.5)
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

// ------------------------------------------------- helper authorisation

const jaan = (method, path, body) => call('jaan', method, path, body)
const RECIPIENT = { name: 'John Landlord', iban: IBAN }

/** Starts with no helper, then the owner invites Mari. Returns the invitation id. */
async function inviteMari(setting = { helpMode: 'OVER', threshold: 100 }) {
  reset({ withHelper: false })
  const found = await owner('GET', '/owner/directory?q=%40maritamm')
  assert.equal(found.body.name, 'Mari Tamm')
  const invited = await owner('POST', '/owner/helper/invite', { helperId: found.body.id, ...setting })
  assert.equal(invited.status, 201)
  assert.equal(invited.body.status, 'INVITED')
  return invited.body.id
}

test('the directory finds a person by email, phone or Wisetag, and nothing else', async () => {
  for (const q of ['mari.tamm@example.com', '+372 5550 1234', '55501234', '@maritamm', 'maritamm']) {
    const found = await owner('GET', `/owner/directory?q=${encodeURIComponent(q)}`)
    assert.equal(found.body.id, 'mari', q)
  }
  assert.equal((await owner('GET', '/owner/directory?q=mari')).status, 404)
  assert.equal((await owner('GET', '/owner/directory?q=')).status, 404)
  // Only the owner searches.
  assert.equal((await helper('GET', '/owner/directory?q=%40jaankask')).status, 403)
})

test('without an ACTIVE link nothing can be prepared', async () => {
  // No helper at all.
  reset({ withHelper: false })
  assert.equal((await owner('POST', '/owner/transfers', { note: 'rent' })).status, 409)

  // Invited but not accepted yet.
  await inviteMari()
  assert.equal((await owner('POST', '/owner/transfers', { note: 'rent' })).status, 409)
  assert.equal(db.transfers.length, 0)
})

test('a helper who was removed, or only re-invited, is forbidden to prepare', async () => {
  const id = await pending()
  assert.equal((await owner('DELETE', '/owner/helper')).status, 200)
  assert.equal((await helper('PUT', `/helper/transfers/${id}`, { sourceAmount: 1 })).status, 403)
  assert.equal((await helper('POST', `/helper/transfers/${id}/submit`)).status, 403)

  // Invited again but not accepted: still forbidden.
  await owner('POST', '/owner/helper/invite', { helperId: 'mari', helpMode: 'EVERY' })
  assert.equal((await helper('PUT', `/helper/transfers/${id}`, { sourceAmount: 1 })).status, 403)
})

test('only the invited person can accept, and then she can prepare', async () => {
  const invitation = await inviteMari()
  assert.equal((await helper('GET', '/me')).body.invitations[0].ownerName, 'Tiiu')

  // Someone else, and the owner herself, cannot accept it.
  assert.equal((await jaan('POST', `/helper/invitations/${invitation}/accept`)).status, 404)
  assert.equal((await owner('POST', `/helper/invitations/${invitation}/accept`)).status, 403)
  assert.equal(db.links.at(-1).status, 'INVITED')

  assert.equal((await helper('POST', `/helper/invitations/${invitation}/accept`)).status, 200)
  assert.equal((await owner('GET', '/me')).body.link.status, 'ACTIVE')
  assert.equal((await owner('GET', '/notifications')).body[0].kind, 'INVITE_ACCEPTED')
  // Accepting twice is refused.
  assert.equal((await helper('POST', `/helper/invitations/${invitation}/accept`)).status, 409)

  assert.equal((await owner('POST', '/owner/transfers', { note: 'rent' })).status, 201)
})

test('a declined invitation is shown to the owner and allows nothing', async () => {
  const invitation = await inviteMari()
  assert.equal((await helper('POST', `/helper/invitations/${invitation}/decline`)).status, 200)
  assert.equal((await owner('GET', '/me')).body.link.status, 'DECLINED')
  assert.equal((await owner('POST', '/owner/transfers', {})).status, 409)
  // She can invite someone else straight away.
  const next = await owner('POST', '/owner/helper/invite', { helperId: 'jaan', helpMode: 'EVERY' })
  assert.equal(next.body.helper.name, 'Jaan Kask')
})

test('only the owner can invite, change the setting or remove; one helper at a time', async () => {
  // The helper has neither her own routes for it nor access to the owner's.
  for (const [method, path] of [
    ['POST', '/helper/invite'],
    ['PUT', '/helper/setting'],
    ['DELETE', '/helper'],
  ]) {
    const body = { helperId: 'jaan', helpMode: 'EVERY' }
    assert.equal((await helper(method, `/owner${path}`, body)).status, 403)
    assert.equal((await helper(method, `/helper${path}`, body)).status, 404)
  }
  assert.equal(db.links.at(-1).helpMode, 'OVER')

  // The owner already has Mari: no second helper.
  assert.equal((await owner('POST', '/owner/helper/invite', { helperId: 'jaan', helpMode: 'EVERY' })).status, 409)

  // The owner changes the setting; only the offered amounts are accepted.
  assert.equal((await owner('PUT', '/owner/helper/setting', { helpMode: 'OVER', threshold: 75 })).status, 400)
  const changed = await owner('PUT', '/owner/helper/setting', { helpMode: 'OVER', threshold: 200 })
  assert.equal(changed.body.threshold, 200)
})

test('removing the helper cancels what she had not submitted, and tells her', async () => {
  const submitted = await pending()
  const unsubmitted = await draft()
  assert.equal((await owner('DELETE', '/owner/helper')).status, 200)

  const byId = (id) => db.transfers.find((t) => t.id === id)
  assert.equal(byId(unsubmitted).status, 'CANCELLED')
  assert.equal(byId(unsubmitted).reason, 'HELPER_REMOVED')
  // What she already handed over stays with the owner to decide.
  assert.equal(byId(submitted).status, 'PENDING_APPROVAL')

  assert.equal((await helper('GET', '/notifications')).body[0].kind, 'HELPER_REMOVED')
  assert.equal((await owner('GET', '/me')).body.link, null)
  assert.equal((await helper('GET', '/me')).body.ownerName, null)
})

test('the helper reads the balance only while preparing a requested transfer', async () => {
  const id = await draft()
  const open = await helper('GET', `/helper/transfers/${id}/balance`)
  assert.deepEqual(open.body, { balance: 1240.5, currency: 'EUR' })

  // Submitted: no longer preparing.
  await helper('POST', `/helper/transfers/${id}/submit`)
  assert.equal((await helper('GET', `/helper/transfers/${id}/balance`)).status, 403)

  // Preparing, but removed as helper.
  const second = await draft()
  await owner('DELETE', '/owner/helper')
  assert.equal((await helper('GET', `/helper/transfers/${second}/balance`)).status, 403)

  // Someone who is not the helper of this transfer.
  assert.equal((await jaan('GET', `/helper/transfers/${id}/balance`)).status, 404)
})

test('a transfer under the threshold is sent directly and stays hidden from the helper', async () => {
  // Seed setting: ask for help over 100 EUR.
  const first = await owner('POST', '/owner/send', { amount: 30 })
  assert.equal(first.body.outcome, 'NEEDS_DETAILS')

  const { body } = await owner('POST', '/owner/send', { amount: 30, recipient: RECIPIENT })
  assert.equal(body.outcome, 'SENT')
  assert.equal(db.users.tiiu.balance, 1240.5 - 30.35)

  // The helper never sees the owner's independent transfer.
  assert.deepEqual((await helper('GET', '/helper/transfers')).body, [])
  assert.equal((await helper('GET', `/helper/transfers/${body.transfer.id}`)).status, 404)
  assert.deepEqual((await helper('GET', '/notifications')).body, [])
  // The owner does.
  assert.equal((await owner('GET', '/owner/transfers')).body[0].direct, true)
})

test('a transfer over the threshold is not sent but becomes a help request', async () => {
  const { body } = await owner('POST', '/owner/send', { amount: 250, recipient: RECIPIENT })
  assert.equal(body.outcome, 'HELP_REQUESTED')
  assert.equal(db.users.tiiu.balance, 1240.5)

  const [request] = (await helper('GET', '/helper/transfers')).body
  assert.equal(request.status, 'REQUESTED')
  assert.equal(request.requestedAmount, 250)
  // Exactly at the threshold is still her own.
  assert.equal((await owner('POST', '/owner/send', { amount: 100 })).body.outcome, 'NEEDS_DETAILS')
})

test('"help me with every transfer" turns any amount into a help request', async () => {
  await owner('PUT', '/owner/helper/setting', { helpMode: 'EVERY' })
  const { body } = await owner('POST', '/owner/send', { amount: 5, recipient: RECIPIENT })
  assert.equal(body.outcome, 'HELP_REQUESTED')
  assert.equal(db.users.tiiu.balance, 1240.5)
})

test('with no helper the owner sends on her own', async () => {
  reset({ withHelper: false })
  const { body } = await owner('POST', '/owner/send', { amount: 250, recipient: RECIPIENT })
  assert.equal(body.outcome, 'SENT')
})
