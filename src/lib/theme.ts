import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'gullak-theme-v2'
const subs = new Set<() => void>()

function initial(): Theme {
  try {
    const s = localStorage.getItem(KEY)
    if (s === 'light' || s === 'dark') return s
  } catch { /* storage can be blocked */ }
  return 'light'
}

let current: Theme = initial()
const apply = () => {
  const el = document.documentElement
  el.classList.toggle('dark', current === 'dark')
  el.style.colorScheme = current
}
apply()

export function setTheme(t: Theme) {
  current = t
  apply()
  try { localStorage.setItem(KEY, t) } catch { /* ignore */ }
  subs.forEach((f) => f())
}
export function useTheme(): [Theme, (t: Theme) => void] {
  const t = useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => current)
  return [t, setTheme]
}

export type View = 'mobile' | 'desktop'
const VKEY = 'gullak-view-v2'
let view: View = (() => {
  try { const v = localStorage.getItem(VKEY); if (v === 'mobile' || v === 'desktop') return v } catch { /* ignore */ }
  return 'mobile'
})()
const vsubs = new Set<() => void>()
const applyView = () => document.documentElement.classList.toggle('desk', view === 'desktop')
applyView()
export function setView(v: View) {
  view = v
  applyView()
  try { localStorage.setItem(VKEY, v) } catch { /* ignore */ }
  vsubs.forEach((f) => f())
}
export function useView(): [View, (v: View) => void] {
  const v = useSyncExternalStore((f) => { vsubs.add(f); return () => { vsubs.delete(f) } }, () => view)
  return [v, setView]
}
