import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { prefersReducedMotion } from '@/shared/motion'

interface RevealOptions {
  threshold?: number
  /** Extra delay (ms) before the entrance transition begins — used to stagger sections. */
  delay?: number
}

/** Marks a section visible once it enters the viewport (animates only once). */
export function useReveal<T extends HTMLElement>(options: number | RevealOptions = {}) {
  const { threshold = 0.12, delay = 0 } =
    typeof options === 'number' ? { threshold: options } : options
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || prefersReducedMotion()) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setVisible(true)
      observer.disconnect()
    }, { threshold })

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {}
  return { ref, visible, style }
}
