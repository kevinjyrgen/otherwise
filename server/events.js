/**
 * Real-time events. Kept apart from the Socket.IO setup so the transfer rules
 * can emit without importing the server (and run in tests without one).
 */

let io = null

/** Called once by the server with its Socket.IO instance. */
export function attach(server) {
  io = server
}

/** Socket room that receives everything meant for one user. */
export const userRoom = (userId) => `user:${userId}`

/** Sends an event to every window of one user. */
export function emitTo(userId, event, payload) {
  io?.to(userRoom(userId)).emit(event, payload)
}

/** Sends an event to everyone. */
export function emitAll(event, payload) {
  io?.emit(event, payload)
}
