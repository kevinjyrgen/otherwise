import { createContext, useContext } from 'react'

/**
 * Live data of the person using this window: who they are, their transfers
 * and notifications, kept fresh over Socket.IO. Filled by LiveProvider.
 * The owner also gets her saved recipients and regular payments; for the
 * helper those two lists are always empty.
 */
export const LiveContext = createContext(null)

/**
 * @returns {{
 *   role: 'owner'|'helper', me: object, transfers: object[], notifications: object[],
 *   recipients: object[], schedules: object[],
 *   connected: boolean, toast: object|null, dismissToast: () => void,
 *   call: (path: string, options?: object) => Promise<any>,
 *   send: (path: string, body?: object, method?: string) => Promise<any>,
 * } | null} null outside a role area (e.g. on the role picker)
 */
export function useLive() {
  return useContext(LiveContext)
}
