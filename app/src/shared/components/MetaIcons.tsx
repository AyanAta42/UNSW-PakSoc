import type { SVGProps } from 'react'

interface IconProps { size?: number; color?: string }

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { flexShrink: 0 },
  'aria-hidden': true,
})

export function ClockIcon({ size = 13, color }: IconProps) {
  return (
    <svg {...base(size)} color={color}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function PinIcon({ size = 13, color }: IconProps) {
  return (
    <svg {...base(size)} color={color}>
      <path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

export function PriceIcon({ size = 13, color }: IconProps) {
  return (
    <svg {...base(size)} color={color}>
      <path d="M12 2v20" />
      <path d="M16.5 6.5c-1-1.3-2.7-2-4.5-2-2.5 0-4.5 1.5-4.5 3.75S9.5 11.5 12 12s4.5 1.5 4.5 3.75-2 3.75-4.5 3.75c-1.8 0-3.5-.7-4.5-2" />
    </svg>
  )
}
