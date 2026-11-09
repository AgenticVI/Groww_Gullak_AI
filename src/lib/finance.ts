import {
  INSTALMENTS, LATEST_NAV, SIP_AMOUNT, GOAL, TODAY, MONTHS_SHORT, PLANNED_MONTHS,
  type Instalment,
} from '../data/sip'
import { round1 } from '../../shared/format'

export const ANNUAL_RETURN = 0.1
export const STRESS = { year: 2027, annual: -0.1 }

export const monthlyRate = (annual: number) => Math.pow(1 + annual, 1 / 12) - 1

const completed = () => INSTALMENTS.filter((i) => i.status === 'completed')

export const instalmentsOfYear = (year: number) => INSTALMENTS.filter((i) => i.year === year)
export const byKey = (key: string) => INSTALMENTS.find((i) => i.monthKey === key)

export interface Totals {
  invested: number
  units: number
  nav: number
  value: number
  gain: number
  gainPct: number
  paid: number
  skipped: number
  storms: number
}
export function totals(): Totals {
  const c = completed()
  const invested = c.reduce((s, i) => s + i.amount, 0)
  const units = c.reduce((s, i) => s + i.units, 0)
  const value = units * LATEST_NAV
  return {
    invested,
    units,
    nav: LATEST_NAV,
    value,
    gain: value - invested,
    gainPct: invested ? ((value - invested) / invested) * 100 : 0,
    paid: c.length,
    skipped: INSTALMENTS.filter((i) => i.status === 'skipped').length,
    storms: INSTALMENTS.filter((i) => (i.status === 'completed' || i.status === 'skipped') && i.pct < 0).length,
  }
}

export const unitsBefore = (n: number) =>
  INSTALMENTS.filter((i) => i.n < n && i.status === 'completed').reduce((s, i) => s + i.units, 0)

/** ₹ effect of that month's fund move on units held (incl. that month's allotment). */
export function monthEffect(i: Instalment) {
  if (i.status !== 'completed' && i.status !== 'skipped') return 0
  const held = unitsBefore(i.n) + i.units
  return held * (i.navEnd - i.navOrder)
}

export const totalUnitsAfter = (n: number) =>
  INSTALMENTS.filter((i) => i.n <= n && i.status === 'completed').reduce((s, i) => s + i.units, 0)

export const latestCompleted = () => [...INSTALMENTS].reverse().find((i) => i.status === 'completed' || i.status === 'skipped')!

export interface YearStats {
  year: number
  invested: number
  paid: number
  skipped: number
  total: number
  value: number
  complete: boolean
}
/** Real (not projected) year stats. */
export function realYearStats(year: number): YearStats {
  const list = instalmentsOfYear(year)
  const done = list.filter((i) => i.status === 'completed')
  const lastKnown = [...list].reverse().find((i) => i.status === 'completed' || i.status === 'skipped')
  const unitsToDate = completed().filter((i) => i.year <= year).reduce((s, i) => s + i.units, 0)
  const nav = year >= TODAY.year ? LATEST_NAV : lastKnown!.navEnd
  return {
    year,
    invested: done.reduce((s, i) => s + i.amount, 0),
    paid: done.length,
    skipped: list.filter((i) => i.status === 'skipped').length,
    total: list.length,
    value: unitsToDate * nav,
    complete: list.every((i) => i.status === 'completed' || i.status === 'skipped'),
  }
}

// ---------- Projections (illustration at an assumed rate) ----------
export interface ProjPoint {
  n: number // instalment number
  year: number
  month: number
  invested: number // cumulative
  value: number // after this month's growth
}
const stepDate = (k: number) => {
  const idx = TODAY.month + k
  return { year: TODAY.year + Math.floor(idx / 12), month: idx % 12 }
}

export function project(months: number, annual = ANNUAL_RETURN, stress?: typeof STRESS): ProjPoint[] {
  const t = totals()
  let value = t.value
  let invested = t.invested
  const out: ProjPoint[] = []
  for (let k = 0; k < months; k++) {
    const d = stepDate(k)
    const a = stress && d.year === stress.year ? stress.annual : annual
    value = (value + SIP_AMOUNT) * (1 + monthlyRate(a))
    invested += SIP_AMOUNT
    out.push({ n: 23 + k, year: d.year, month: d.month, invested, value })
  }
  return out
}

export const dateLabel = (year: number, month: number) => `${MONTHS_SHORT[month]} ${year}`

/** First month in which value reaches the goal. */
export function monthsToGoal(goal = GOAL.amount, stress?: typeof STRESS) {
  const t = totals()
  if (t.value >= goal) return { index: 0, label: dateLabel(TODAY.year, TODAY.month) }
  const pts = project(240, ANNUAL_RETURN, stress)
  const idx = pts.findIndex((p) => p.value >= goal)
  const p = pts[idx]
  return { index: idx + 1, label: dateLabel(p.year, p.month) }
}

export function horizon(years: number) {
  const months = years * 12
  const pts = project(months)
  const last = pts[pts.length - 1]
  const endIdx = TODAY.month + months // value as at Nov (TODAY.year + years)
  return {
    years,
    months,
    points: pts,
    value: last.value,
    invested: last.invested,
    gain: last.value - last.invested,
    gainPct: ((last.value - last.invested) / last.invested) * 100,
    byLabel: dateLabel(TODAY.year + Math.floor(endIdx / 12), endIdx % 12),
    lastYear: last.year, // year of last instalment
    lastMonth: last.month,
  }
}

export const goalProgress = () => Math.min(100, (totals().value / GOAL.amount) * 100)
export { round1, PLANNED_MONTHS }
