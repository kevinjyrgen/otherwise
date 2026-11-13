import { createContext, useContext } from 'react'

/**
 * Live data of the person using this window: who they are, their transfers
 * and notifications, kept fresh over Socket.IO. Filled by LiveProvider.
 */
export const LiveContext = createContext(null)

/**
 * @returns {{
 *   role: 'owner'|'helper', me: object, transfers: object[], notifications: object[],
 *   connected: boolean, toast: object|null, dismissToast: () => void,
 *   call: (path: string, options?: object) => Promise<any>,
 *   send: (path: string, body?: object, method?: string) => Promise<any>,
 * } | null} null outside a role area (e.g. on the role picker)
 */
export function useLive() {
  return useContext(LiveContext)
}
