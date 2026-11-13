/**
 * Progress indicator on top of the helper's form.
 * @param {{steps: string[], current: number}} props `current` is zero-based
 */
export default function Stepper({ steps, current }) {
  return (
    <ol className="flex gap-2">
      {steps.map((label, index) => (
        <li key={label} className="flex-1">
          <div className={`h-1 rounded-full ${index <= current ? 'bg-bright-green' : 'bg-white/15'}`} />
          <span className={`mt-2 block text-sm ${index === current ? 'font-semibold text-white' : 'text-white/50'}`}>
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}
