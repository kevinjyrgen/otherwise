import { Link } from 'react-router-dom'

const variants = {
  primary: 'bg-bright-green text-forest-green hover:brightness-105',
  secondary: 'bg-card text-white hover:bg-card-hover',
}

// Owner buttons ("lg") are at least 56px tall with 20px text.
const sizes = {
  lg: 'min-h-16 px-8 text-xl',
  md: 'min-h-12 px-6 text-base',
}

/**
 * Pill-shaped button. Renders a link when `to` is given.
 * @param {{variant?: 'primary'|'secondary', size?: 'lg'|'md', to?: string, className?: string}} props
 */
export default function Button({ variant = 'primary', size = 'md', to, className = '', ...props }) {
  const classes = `flex w-full items-center justify-center rounded-full font-bold transition disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`
  if (to) return <Link to={to} className={classes} {...props} />
  return <button type="button" className={classes} {...props} />
}
