import { useEffect } from 'react'
import { PALETTE } from '@/config/theme'

/** App-wide default — the aurora page base. Matches index.html's static meta,
 *  the manifest theme_color, and the html shell colour. */
const DEFAULT_THEME_COLOR = PALETTE.page

/**
 * Colours the Android PWA system bars (top status bar, and the bottom nav bar on
 * 3-button devices) to match the current page's top/edge background, restoring the
 * app default on unmount.
 *
 * iOS gets this for free: `apple-mobile-web-app-status-bar-style: black-translucent`
 * lets the page's own aurora bleed under the bars. Android can't draw content behind
 * an *opaque* system bar (browsers ignore an alpha in `theme-color`), so instead we
 * paint the bar the same solid colour as the page edge — no visible seam.
 *
 * Most routes sit on the shared `#03040A` aurora base and need no override (the static
 * meta already matches). Call this only on a route whose top background differs — e.g.
 * the Tasks board, whose header is a solid card colour.
 */
export function useThemeColor(color: string = DEFAULT_THEME_COLOR) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    meta.setAttribute('content', color)
    return () => meta.setAttribute('content', DEFAULT_THEME_COLOR)
  }, [color])
}
