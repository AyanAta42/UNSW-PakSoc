import { useEffect, useRef, useState, type CSSProperties } from 'react'

interface Props {
  value: number
  digits?: number
  className?: string
  style?: CSSProperties
}

function DigitColumn({ digit, animate }: { digit: number; animate: boolean }) {
  return (
    <span className="odometer-col" aria-hidden>
      <span
        className="odometer-strip"
        style={{
          transform: `translateY(${-digit * 10}%)`,
          transition: animate ? undefined : 'none',
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="odometer-digit">{i}</span>
        ))}
      </span>
    </span>
  )
}

/** Odometer digits — snap to the first value instantly, then animate on ticks. */
export function OdometerNumber({ value, digits = 2, className = '', style }: Props) {
  const padded = String(Math.max(0, value)).padStart(digits, '0').slice(-digits)
  const [animate, setAnimate] = useState(false)
  const seen = useRef(false)

  useEffect(() => {
    // After first paint with the real value, enable slide transitions for subsequent ticks
    if (seen.current) return
    seen.current = true
    const id = requestAnimationFrame(() => setAnimate(true))
    return () => cancelAnimationFrame(id)
  }, [value])

  return (
    <span className={`odometer ${className}`} style={style}>
      <span className="sr-only">{padded}</span>
      {padded.split('').map((d, i) => (
        <DigitColumn key={i} digit={Number(d)} animate={animate} />
      ))}
    </span>
  )
}
