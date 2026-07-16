import { DustCanvas } from './DustCanvas'
import { MouseSpotlight } from './MouseSpotlight'

/**
 * Ambient, always-on background motion — drifting radial gradients, a giant
 * blurred aurora behind the hero, a faint film-grain layer, floating dust
 * motes, and a cursor spotlight. Purely decorative (aria-hidden),
 * GPU-accelerated, and paused under prefers-reduced-motion / hidden tabs.
 */
export function AmbientBackground() {
  return (
    <>
      <div aria-hidden className="ambient-root">
        <div className="ambient-layer ambient-layer-a" />
        <div className="ambient-layer ambient-layer-b" />
        <div className="ambient-aurora" />
        <div className="ambient-grain" />
      </div>
      <MouseSpotlight />
      <DustCanvas />
    </>
  )
}
