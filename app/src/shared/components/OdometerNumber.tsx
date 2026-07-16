import type { CSSProperties } from 'react'

interface Props {
  /** Numeric value; rendered zero-padded to `digits` places. */
  value: number
  digits?: number
  className?: string
  style?: CSSProperties
}

function DigitColumn({ digit }: { digit: number }) {
  return (
    <span className="odometer-col" aria-hidden>
      <span className="odometer-strip" style={{ transform: `translateY(${-digit * 10}%)` }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="odometer-digit">{i}</span>
        ))}
      </span>
    </span>
  )
}

/** Displays a number as vertically-sliding odometer digits — never a hard swap. */
export function OdometerNumber({ value, digits = 2, className = '', style }: Props) {
  const padded = String(Math.max(0, value)).padStart(digits, '0').slice(-digits)
  return (
    <span className={`odometer ${className}`} style={style}>
      <span className="sr-only">{padded}</span>
      {padded.split('').map((d, i) => <DigitColumn key={i} digit={Number(d)} />)}
    </span>
  )
}
