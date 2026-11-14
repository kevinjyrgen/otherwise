/**
 * Owner-only routes (mounted behind requireRole('owner')).
 * The owner asks for a transfer and decides about it. She never edits it.
 * She alone manages who her helper is, whom she saved as a recipient, and her
 * regular payments.
 */
import { Router } from 'express'
import * as links from '../links.js'
import * as recipients from '../recipients.js'
import * as schedules from '../schedules.js'
import * as transfers from '../transfers.js'

const router = Router()

/** Sends the transfer back the way the owner may see it. */
const reply = (req, res, transfer, status = 200) =>
  res.status(status).json(transfers.viewFor(req.user, transfer))

router.get('/transfers', (req, res) => res.json(transfers.listFor(req.user)))

router.get('/transfers/:id', (req, res) => res.json(transfers.getFor(req.user, req.params.id)))

/** Asks the helper to prepare a transfer: with a note, or with a photo of a bill. */
router.post('/transfers', (req, res) =>
  reply(
    req,
    res,
    transfers.createRequest(req.user, { note: req.body?.note, photo: req.body?.photo }),
    201,
  ),
)

/** The bill photo she sent with a request. */
router.get('/transfers/:id/photo', (req, res) =>
  res.set('Cache-Control', 'private, no-store').sendFile(transfers.photoFor(req.user, req.params.id)),
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

// ---- saved recipients: only the owner, and only from a transfer that was sent.

router.get('/recipients', (req, res) => res.json(recipients.listFor(req.user)))

router.post('/recipients', (req, res) =>
  res.status(201).json(recipients.saveFromTransfer(req.user, req.body?.transferId)),
)

router.delete('/recipients/:id', (req, res) => {
  recipients.remove(req.user, req.params.id)
  res.json({ ok: true })
})

// ---- regular payments: only the owner can skip one or stop them.

router.get('/schedules', (req, res) => res.json(schedules.listFor(req.user)))

router.post('/schedules/:id/skip', (req, res) =>
  res.json(schedules.setSkipNext(req.user, req.params.id, req.body?.skip !== false)),
)

router.post('/schedules/:id/stop', (req, res) => {
  schedules.stop(req.user, req.params.id)
  res.json({ ok: true })
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
