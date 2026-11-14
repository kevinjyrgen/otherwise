/**
 * Progress indicator on top of the helper's form: numbered dots joined by a
 * line, like a send-money flow.
 * @param {{steps: string[], current: number}} props `current` is zero-based
 */
export default function Stepper({ steps, current }) {
  return (
    <ol className="flex">
      {steps.map((label, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center">
            {/* Line to the previous step. */}
            {index > 0 && (
              <span
                className={`absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 ${index <= current ? 'bg-brand-pink' : 'bg-white/15'}`}
              />
            )}
            <span
              className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                done || active ? 'bg-brand-pink text-brand-green' : 'bg-card-hover text-white/50'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>
            <span className={`mt-2 text-sm ${active ? 'font-semibold text-white' : 'text-white/50'}`}>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
