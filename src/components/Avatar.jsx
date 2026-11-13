/**
 * Round badge with a person's initials ("Mari Tamm" → "MT").
 * @param {{name: string, className?: string}} props
 */
export default function Avatar({ name, className = '' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bright-green/15 font-bold text-bright-green ${className}`}
    >
      {initials}
    </span>
  )
}
