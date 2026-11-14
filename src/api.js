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

/**
 * Fetches a picture as the given user. An <img> cannot send the user header
 * itself, so the picture is downloaded here and handed over as a local URL.
 * @param {string} userId
 * @param {string} path e.g. '/owner/transfers/123/photo'
 * @returns {Promise<string>} an object URL; release it with URL.revokeObjectURL
 */
export async function apiImage(userId, path) {
  const response = await fetch(`/api${path}`, { headers: { 'x-user-id': userId } })
  if (!response.ok) throw new Error('The photo could not be loaded.')
  return URL.createObjectURL(await response.blob())
}
