const looks = {
  success: { circle: 'bg-brand-pink text-brand-green', path: 'M5 12.5l4.5 4.5L19 7.5' },
  problem: { circle: 'bg-red-400/20 text-red-300', path: 'M6 6l12 12M18 6L6 18' },
  neutral: { circle: 'bg-white/10 text-white', path: 'M5 12h14' },
  waiting: { circle: 'bg-brand-pink/15 text-brand-pink', path: 'M12 6.5V12l3.5 2.5' },
}

/** Which look fits each transfer status. */
const byStatus = {
  SENT: 'success',
  FAILED: 'problem',
  DECLINED: 'neutral',
  CANCELLED: 'neutral',
}

/**
 * Round icon that tells the outcome at a glance: tick, cross, dash or clock.
 * @param {{status: string, big?: boolean}} props `big` is the owner's size
 */
export default function StatusIcon({ status, big = false }) {
  const look = looks[byStatus[status] ?? 'waiting']
  const size = big ? 'h-24 w-24' : 'h-14 w-14'
  return (
    <span className={`flex shrink-0 animate-pop items-center justify-center rounded-full ${size} ${look.circle}`}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={look.path} />
      </svg>
    </span>
  )
}
