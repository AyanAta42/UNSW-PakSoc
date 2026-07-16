import { useEffect, useRef, useState } from 'react'

interface PointerPosition { x: number; y: number; active: boolean }

/** Tracks a fine-pointer cursor only when motion has not been reduced. */
export function usePointerPosition(): PointerPosition {
  const [pointer, setPointer] = useState<PointerPosition>({ x: 50, y: 35, active: false })
  const frameRef = useRef<number | null>(null)
  const nextRef = useRef<PointerPosition>(pointer)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reducedMotion.matches) return

    const onPointerMove = (event: PointerEvent) => {
      nextRef.current = { x: event.clientX, y: event.clientY, active: true }
      if (frameRef.current !== null) return
      frameRef.current = requestAnimationFrame(() => {
        setPointer(nextRef.current)
        frameRef.current = null
      })
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return pointer
}
