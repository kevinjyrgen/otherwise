/**
 * Demo identity. There is no login: the client says who it is with an
 * `x-user-id` header and the server looks the role up itself. The role is
 * never taken from the client.
 */
import { activeLinkAsHelper, currentLink, invitationsFor, ownerLinkView } from './links.js'
import { LINK } from './seed.js'
import { db } from './store.js'

/** Express middleware: resolves req.user or answers 401. */
export function authenticate(req, res, next) {
  const user = db.users[req.get('x-user-id')]
  if (!user) return res.status(401).json({ error: 'Unknown user.' })
  req.user = user
  next()
}

/**
 * Express middleware factory: lets only one role through.
 * @param {'owner'|'helper'} role
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'You are not allowed to do this.' })
    }
    next()
  }
}

/**
 * What a user may know about themselves. The helper's view is built from an
 * explicit list of fields so the owner's balance can never leak into it.
 */
export function selfView(user) {
  if (user.role === 'owner') {
    const link = currentLink(user.id)
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      balance: user.balance,
      currency: user.currency,
      // Her helper link in any live state (invited, active, declined), or null.
      link: ownerLinkView(link),
      // Set only when the helper is ACTIVE, i.e. can really prepare transfers.
      helperName: link?.status === LINK.ACTIVE ? db.users[link.helperId].name : null,
    }
  }
  const active = activeLinkAsHelper(user.id)
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    // Who she helps right now, or null.
    ownerName: active ? db.users[active.ownerId].name : null,
    invitations: invitationsFor(user.id),
  }
}
