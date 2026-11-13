/** A broken rule: carries the HTTP status and a message in plain words. */
export class RuleError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} message shown to the person as it is
   */
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
