/**
 * Owner-only routes (mounted behind requireRole('owner')).
 * The owner asks for a transfer and decides about it. She never edits it.
 * She alone manages who her helper is.
 */
import { Router } from 'express'
import * as links from '../links.js'
import * as transfers from '../transfers.js'

const router = Router()

/** Sends the transfer back the way the owner may see it. */
const reply = (req, res, transfer, status = 200) =>
  res.status(status).json(transfers.viewFor(req.user, transfer))

router.get('/transfers', (req, res) => res.json(transfers.listFor(req.user)))

router.get('/transfers/:id', (req, res) => res.json(transfers.getFor(req.user, req.params.id)))

router.post('/transfers', (req, res) =>
  reply(req, res, transfers.createRequest(req.user, req.body?.note), 201),
)

router.post('/transfers/:id/approve', (req, res) =>
  reply(req, res, transfers.approve(req.user, req.params.id)),
)

router.post('/transfers/:id/decline', (req, res) =>
  reply(req, res, transfers.decline(req.user, req.params.id, req.body?.reason)),
)

router.post('/transfers/:id/confirm', async (req, res) =>
  reply(req, res, await transfers.confirm(req.user, req.params.id, req.body ?? {})),
)

/** "Send money": sent directly, or turned into a help request by her help setting. */
router.post('/send', async (req, res) => {
  const { outcome, transfer } = await transfers.sendMoney(req.user, req.body ?? {})
  res.json({ outcome, transfer: transfer && transfers.viewFor(req.user, transfer) })
})

// ---- her helper: only the owner can invite, change the setting or remove.

router.get('/directory', (req, res) => res.json(links.findInDirectory(req.user, req.query.q)))

router.post('/helper/invite', (req, res) =>
  res.status(201).json(links.ownerLinkView(links.invite(req.user, req.body ?? {}))),
)

router.put('/helper/setting', (req, res) =>
  res.json(links.ownerLinkView(links.updateSetting(req.user, req.body ?? {}))),
)

router.delete('/helper', (req, res) => {
  links.remove(req.user)
  res.json({ ok: true })
})

export default router
