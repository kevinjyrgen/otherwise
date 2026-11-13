/**
 * Label/value list used for transfer details.
 * @param {{rows: Array<[string, React.ReactNode]|false|null>, big?: boolean}} props
 *   `big` is the owner's size (20px text, stacked so long values never squeeze).
 */
export default function Rows({ rows, big = false }) {
  return (
    <dl className="divide-y divide-white/10">
      {rows.filter(Boolean).map(([label, value]) => (
        <div
          key={label}
          className={big ? 'py-4' : 'flex items-baseline justify-between gap-4 py-3'}
        >
          <dt className={big ? 'text-lg text-white/60' : 'shrink-0 text-white/60'}>{label}</dt>
          <dd className={big ? 'mt-1 text-2xl font-semibold break-words' : 'min-w-0 text-right font-semibold break-words'}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
