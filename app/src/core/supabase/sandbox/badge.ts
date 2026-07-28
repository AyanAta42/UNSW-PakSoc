/**
 * A small always-on-top marker so you can never mistake a sandbox session for
 * the real thing. Plain DOM on purpose — it stays completely outside the React
 * tree, so nothing about the app under test changes because of it.
 */

import { setSandboxEnabled } from './enabled'
import { onSandboxChange, resetSandbox, writeCount } from './store'

const STYLE = `
position:fixed; left:10px; bottom:10px; z-index:2147483647;
display:flex; align-items:center; gap:8px;
padding:6px 10px; border-radius:999px;
font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.04em;
color:#0b0b0b; background:#ffd230; border:1px solid rgba(0,0,0,.25);
box-shadow:0 4px 14px rgba(0,0,0,.3); user-select:none;
`.replace(/\s+/g, ' ')

const BTN = `
appearance:none; border:1px solid rgba(0,0,0,.3); border-radius:999px;
padding:3px 7px; font:600 10px/1 inherit; letter-spacing:.04em;
background:rgba(0,0,0,.08); color:inherit; cursor:pointer;
`.replace(/\s+/g, ' ')

export function mountSandboxBadge(): void {
  if (document.getElementById('sandbox-badge')) return

  const el = document.createElement('div')
  el.id = 'sandbox-badge'
  el.setAttribute('style', STYLE)

  const label = document.createElement('span')
  const reset = document.createElement('button')
  const exit = document.createElement('button')

  reset.textContent = 'RESET'
  reset.setAttribute('style', BTN)
  reset.title = 'Discard every local change and show the database as it really is'
  reset.onclick = () => {
    if (confirm('Discard all local sandbox changes?')) {
      resetSandbox()
      location.reload()
    }
  }

  exit.textContent = 'EXIT'
  exit.setAttribute('style', BTN)
  exit.title = 'Leave sandbox mode — writes will hit the real database again'
  exit.onclick = () => {
    if (confirm('Leave sandbox mode? Writes will hit the REAL database again.')) {
      setSandboxEnabled(false)
      location.reload()
    }
  }

  const paint = () => {
    const n = writeCount()
    label.textContent = `SANDBOX · ${n} local write${n === 1 ? '' : 's'}`
  }
  paint()
  onSandboxChange(paint)

  el.append(label, reset, exit)
  document.body.append(el)
}

const WARN_STYLE = `
position:fixed; left:0; right:0; bottom:0; z-index:2147483647;
display:flex; align-items:center; justify-content:center; gap:12px;
padding:10px 14px; text-align:center;
font:700 12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.06em;
color:#fff; background:#c0121b; border-top:2px solid #ff5964;
box-shadow:0 -6px 20px rgba(0,0,0,.45); user-select:none;
`.replace(/\s+/g, ' ')

/**
 * Shown when localhost is talking to the live database. The sandbox badge alone
 * wasn't enough: its *absence* was silent, so a tab where the sandbox never
 * started looked identical to one where it did. Now the unsafe state is the
 * loud one.
 */
export function mountLiveWarning(): void {
  if (document.getElementById('live-db-warning')) return

  const el = document.createElement('div')
  el.id = 'live-db-warning'
  el.setAttribute('style', WARN_STYLE)

  const label = document.createElement('span')
  label.textContent = '⚠  LIVE DATABASE — every change you make here is REAL and public'

  const enable = document.createElement('button')
  enable.textContent = 'SWITCH TO SANDBOX'
  enable.setAttribute('style', BTN + 'background:rgba(255,255,255,.16); border-color:rgba(255,255,255,.5);')
  enable.onclick = () => {
    setSandboxEnabled(true)
    location.reload()
  }

  el.append(label, enable)
  document.body.append(el)
}
