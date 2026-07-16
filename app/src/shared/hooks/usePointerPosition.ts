import { useEffect, useState } from 'react'

interface PointerPosition { x: number; y: number; active: boolean }

/** Tracks a fine-pointer cursor only when motion has not been reduced. */
export function usePointerPosition(): PointerPosition {
  const [pointer, setPointer] = useState<PointerPosition>({ x: 50, y: 35, active: false })

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!finePointer.matches || reducedMotion.matches) return

    const onPointerMove = (event: PointerEvent) => {
      setPointer({ x: event.clientX, y: event.clientY, active: true })
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  return pointer
}
