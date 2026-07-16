import { useEffect, useRef, useState } from 'react'

/** Marks a section visible once it enters the viewport. */
export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

  return { ref, visible }
}
