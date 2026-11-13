/**
 * Helper-only routes (mounted behind requireRole('helper')).
 * The helper prepares, submits and can cancel. There is deliberately no approve, confirm
 * or send route here.
 */
import { Router } from 'express'
import { CURRENCIES, getQuote } from '../payments/index.js'
import * as links from '../links.js'
import * as transfers from '../transfers.js'

const router = Router()

/** Sends the transfer back the way the helper may see it. */
const reply = (req, res, transfer) => res.json(transfers.viewFor(req.user, transfer))

router.get('/currencies', (req, res) => res.json(CURRENCIES))

router.get('/quote', async (req, res) => {
  const amount = Number(req.query.amount)
  const currency = String(req.query.currency)
  if (!(amount > 0) || !CURRENCIES.includes(currency)) {
    return res.status(400).json({ error: 'Enter an amount and choose a currency.' })
  }
  res.json(await getQuote(amount, currency))
})

router.get('/transfers', (req, res) => res.json(transfers.listFor(req.user)))

router.get('/transfers/:id', (req, res) => res.json(transfers.getFor(req.user, req.params.id)))

router.put('/transfers/:id', async (req, res) =>
  reply(req, res, await transfers.saveDraft(req.user, req.params.id, req.body ?? {})),
)

router.post('/transfers/:id/submit', async (req, res) =>
  reply(req, res, await transfers.submit(req.user, req.params.id)),
)

router.post('/transfers/:id/cancel', (req, res) =>
  reply(req, res, transfers.cancel(req.user, req.params.id)),
)

/** The owner's balance: only while preparing a transfer she asked for, else 403. */
router.get('/transfers/:id/balance', (req, res) =>
  res.json(transfers.balanceFor(req.user, req.params.id)),
)

// ---- invitations: only the invited person can answer.

router.post('/invitations/:id/accept', (req, res) => {
  links.accept(req.user, req.params.id)
  res.json({ ok: true })
})

router.post('/invitations/:id/decline', (req, res) => {
  links.declineInvitation(req.user, req.params.id)
  res.json({ ok: true })
})

export default router
