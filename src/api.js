/**
 * Small fetch wrapper for the server API.
 *
 * The user id comes from the route (/owner or /helper), not from storage, so
 * two windows of the same browser can be two different people.
 */

/** Demo user behind each role. */
export const USER_ID = { owner: 'tiiu', helper: 'mari' }

/**
 * Calls the API as the given user.
 * @param {string} userId
 * @param {string} path e.g. '/me'
 * @param {{method?: string, body?: object}} [options]
 * @returns {Promise<any>} parsed JSON
 * @throws {Error} with the server's plain-words message
 */
export async function api(userId, path, { method = 'GET', body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: { 'x-user-id': userId, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Something went wrong.')
  return data
}
