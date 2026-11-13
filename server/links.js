/**
 * The owner–helper link: who is allowed to help whom, and how much help the
 * owner wants. An owner has at most one helper at a time.
 *
 * INVITED → ACTIVE (helper accepts) or DECLINED (helper declines);
 * REMOVED ends any of them (owner removes or changes her helper).
 *
 * Only an ACTIVE link lets the helper prepare transfers.
 */
import { randomUUID } from 'node:crypto'
import { RuleError } from './errors.js'
import { emitTo } from './events.js'
import { pushNotification } from './notify.js'
import { LINK } from './seed.js'
import { db, save } from './store.js'
// Note: transfers.js also imports this file. That circle is fine because both
// sides only call each other inside functions, after both modules have loaded.
import { cancelUnsubmitted } from './transfers.js'

/** Amounts (EUR) the owner can pick for "ask for help when a transfer is over …". */
export const THRESHOLDS = [50, 100, 200]

// ---------------------------------------------------------------- queries

/** The owner's link that is still alive (invited, active or declined), or undefined. */
export function currentLink(ownerId) {
  return db.links.findLast((l) => l.ownerId === ownerId && l.status !== LINK.REMOVED)
}

/** The owner's ACTIVE link, or undefined. */
export function activeLink(ownerId) {
  const link = currentLink(ownerId)
  return link?.status === LINK.ACTIVE ? link : undefined
}

/** True if this helper is, right now, the active helper of this owner. */
export function isActiveHelper(ownerId, helperId) {
  return activeLink(ownerId)?.helperId === helperId
}

/** The ACTIVE link in which this user is the helper, or undefined. */
export function activeLinkAsHelper(helperId) {
  return db.links.find((l) => l.helperId === helperId && l.status === LINK.ACTIVE)
}

/**
 * Does the owner's help setting say this amount should go to her helper?
 * No active helper means no: she sends on her own.
 */
export function needsHelp(ownerId, amount) {
  const link = activeLink(ownerId)
  if (!link) return false
  return link.helpMode === 'EVERY' || amount > link.threshold
}

// ------------------------------------------------------------------ views

/** The owner's view of her link: status, setting and who the helper is. */
export function ownerLinkView(link) {
  if (!link) return null
  const helper = db.users[link.helperId]
  return {
    id: link.id,
    status: link.status,
    helpMode: link.helpMode,
    threshold: link.threshold,
    helper: { id: helper.id, name: helper.name, wisetag: helper.wisetag },
  }
}

/** Invitations waiting for this person's answer. */
export function invitationsFor(helperId) {
  return db.links
    .filter((l) => l.helperId === helperId && l.status === LINK.INVITED)
    .map((l) => ({
      id: l.id,
      ownerName: db.users[l.ownerId].name,
      helpMode: l.helpMode,
      threshold: l.threshold,
    }))
}

// ---------------------------------------------------------------- helpers

/** Validates the "when to ask for help" choice. */
function readSetting(body) {
  if (body.helpMode === 'EVERY') return { helpMode: 'EVERY', threshold: null }
  if (body.helpMode === 'OVER' && THRESHOLDS.includes(body.threshold)) {
    return { helpMode: 'OVER', threshold: body.threshold }
  }
  throw new RuleError(400, 'Choose when you want help.')
}

/** Saves and tells both people's windows to refresh. */
function touch(link, status = link.status) {
  link.status = status
  link.updatedAt = new Date().toISOString()
  save()
  emitTo(link.ownerId, 'changed')
  emitTo(link.helperId, 'changed')
}

/** What a link notification needs for its text. */
const names = (link) => ({
  ownerName: db.users[link.ownerId].name,
  helperName: db.users[link.helperId].name,
})

const digits = (text) => String(text ?? '').replace(/\D/g, '')

// ---------------------------------------------------------- owner actions

/**
 * Looks a person up in the mock directory by email, phone number or Wisetag.
 * Exact matches only, so the directory cannot be browsed.
 * @returns {{id: string, name: string, wisetag: string}}
 */
export function findInDirectory(owner, query) {
  const q = String(query ?? '').trim().toLowerCase()
  const phone = digits(q)
  const match = Object.values(db.users).find((user) => {
    if (user.id === owner.id || user.role !== 'helper') return false
    return (
      user.email === q ||
      user.wisetag === q ||
      user.wisetag === `@${q}` ||
      // Phone with or without the country code, ignoring spaces.
      (phone.length >= 7 && digits(user.phone).endsWith(phone))
    )
  })
  if (!q || !match) {
    throw new RuleError(404, 'We could not find anyone with that email, phone number or Wisetag.')
  }
  return { id: match.id, name: match.name, wisetag: match.wisetag }
}

/** The owner invites someone to be her helper. One helper at a time. */
export function invite(owner, body) {
  const current = currentLink(owner.id)
  if (current && current.status !== LINK.DECLINED) {
    throw new RuleError(409, 'You already have a helper. Remove them first.')
  }
  const helper = db.users[body.helperId]
  if (!helper || helper.id === owner.id || helper.role !== 'helper') {
    throw new RuleError(404, 'We could not find that person.')
  }
  const setting = readSetting(body)
  // A declined invite is closed for good once she invites again.
  if (current) current.status = LINK.REMOVED

  const now = new Date().toISOString()
  const link = {
    id: randomUUID(),
    ownerId: owner.id,
    helperId: helper.id,
    status: LINK.INVITED,
    ...setting,
    createdAt: now,
    updatedAt: now,
  }
  db.links.push(link)
  touch(link)
  pushNotification(helper.id, 'INVITE', names(link))
  return link
}

/** The owner changes when she wants help. Nobody else can. */
export function updateSetting(owner, body) {
  const link = currentLink(owner.id)
  if (!link || link.status === LINK.DECLINED) {
    throw new RuleError(409, 'You do not have a helper yet.')
  }
  Object.assign(link, readSetting(body))
  touch(link)
  return link
}

/**
 * The owner removes her helper (or withdraws an invite). Transfers the helper
 * had not submitted yet are cancelled, and she is told.
 */
export function remove(owner) {
  const link = currentLink(owner.id)
  if (!link) throw new RuleError(409, 'You do not have a helper.')
  const wasDeclined = link.status === LINK.DECLINED
  touch(link, LINK.REMOVED)
  cancelUnsubmitted(link)
  // Someone who already said no does not need to hear about it again.
  if (!wasDeclined) pushNotification(link.helperId, 'HELPER_REMOVED', names(link))
  return link
}

// --------------------------------------------------------- helper actions

/** Finds an invitation addressed to this person. Anything else looks like "not found". */
function myInvitation(user, id) {
  const link = db.links.find((l) => l.id === id)
  if (!link || link.helperId !== user.id) throw new RuleError(404, 'Invitation not found.')
  if (link.status !== LINK.INVITED) {
    throw new RuleError(409, 'This invitation is no longer open.')
  }
  return link
}

/** Only the invited person can accept. From now on she may prepare transfers. */
export function accept(user, id) {
  const link = myInvitation(user, id)
  touch(link, LINK.ACTIVE)
  pushNotification(link.ownerId, 'INVITE_ACCEPTED', names(link))
  return link
}

/** The invited person says no. */
export function declineInvitation(user, id) {
  const link = myInvitation(user, id)
  touch(link, LINK.DECLINED)
  pushNotification(link.ownerId, 'INVITE_DECLINED', names(link))
  return link
}
