/**
 * Owner-only routes (mounted behind requireRole('owner')).
 * The owner asks for a transfer and decides about it. She never edits it.
 */
import { Router } from 'express'
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

router.post('/transfers/:id/confirm', async (req, res) =>
  reply(req, res, await transfers.confirm(req.user, req.params.id, req.body ?? {})),
)

export default router
