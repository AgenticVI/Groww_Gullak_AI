import { INSTALMENTS, MONTHS_LONG, MONTHS_SHORT, TODAY } from '../data/sip'
import type { Goal } from '../data/goals'
import { monthlyRate, totalUnitsAfter } from './finance'

export const idx = (y: number, m: number) => y * 12 + m
export const labelOf = (i: number) => `${MONTHS_SHORT[i % 12]} ${Math.floor(i / 12)}`
export const NOW_IDX = idx(TODAY.year, TODAY.month) // Nov 2026 = first month not yet known
const r1 = (x: number) => Math.round(x * 10) / 10

export interface GoalRow {
  key: string
  idx: number
  monthName: string
  monthShort: string
  label: string
  added: number
  pct: number
  value: number
  invested: number
  marketEffect: number
  netChange: number
  progress: number
  prevProgress: number
  skipped: boolean
}

/** Month-by-month history of a goal up to Oct 2026. All maths in code. */
export function goalSeries(g: Goal): GoalRow[] {
  const rows: GoalRow[] = []
  let value = 0
  let invested = 0
  for (const inst of INSTALMENTS.filter((i) => i.n <= 22)) {
    const i = idx(inst.year, inst.month)
    if (i < idx(g.startY, g.startM)) continue
    const skipped = !!g.skips?.includes(i) || (g.linked && inst.status === 'skipped')
    const added = skipped ? 0 : g.monthly
    const pct = g.linked ? inst.pct : r1(inst.pct * g.factor)
    const prev = value
    value = g.linked ? totalUnitsAfter(inst.n) * inst.navEnd : (value + added) * (1 + pct / 100)
    invested += added
    const marketEffect = value - prev - added
    rows.push({
      key: inst.monthKey, idx: i, monthName: inst.monthLong, monthShort: inst.monthShort, label: inst.label,
      added, pct, value, invested, marketEffect, netChange: value - prev,
      progress: (value / g.target) * 100, prevProgress: (prev / g.target) * 100, skipped,
    })
  }
  if (g.nov) {
    const skipped = g.nov === 'skipped'
    const added = skipped ? 0 : g.monthly
    const prev = value
    value += added
    invested += added
    rows.push({ key: '2026-11', idx: NOW_IDX, monthName: 'November', monthShort: 'Nov', label: 'Nov 2026', added, pct: 0, value, invested,
      marketEffect: 0, netChange: value - prev, progress: (value / g.target) * 100, prevProgress: (prev / g.target) * 100, skipped })
  }
  return rows
}

/** One full year of saving reached and the latest instalment is in: time for the party popper. */
export const isOneYear = (rows: GoalRow[]) => rows.length >= 12 && !rows[rows.length - 1].skipped

export type Mood = 'happy' | 'sad' | 'broken'
export const moodOf = (g: Goal, rows: GoalRow[]): Mood => (g.broken ? 'broken' : rows.length && rows[rows.length - 1].skipped ? 'sad' : 'happy')

export interface Pace {
  status: 'ahead' | 'onpace' | 'behind' | 'reached'
  label: string | null
  diffMonths: number // reach month minus target month (negative = earlier)
  reachIdx: number | null
}
/** When does the goal reach its target if `monthly` keeps going from `firstIdx` at the assumed rate? */
export function paceFrom(g: Goal, value: number, firstIdx: number): Pace {
  const targetIdx = idx(g.targetY, g.targetM)
  if (value >= g.target) return { status: 'reached', label: labelOf(firstIdx - 1), diffMonths: firstIdx - 1 - targetIdx, reachIdx: firstIdx - 1 }
  const r = monthlyRate(g.rate)
  let v = value
  for (let k = 0; k < 600; k++) {
    v = (v + g.monthly) * (1 + r)
    if (v >= g.target) {
      const reach = firstIdx + k
      const diff = reach - targetIdx
      return { status: diff <= -2 ? 'ahead' : diff <= 1 ? 'onpace' : 'behind', label: labelOf(reach), diffMonths: diff, reachIdx: reach }
    }
  }
  return { status: 'behind', label: null, diffMonths: 999, reachIdx: null }
}

/** Illustrative value of the Gullak after 1, 3, 5 and 10 years if the monthly instalment continues (assumed steady rate, not a forecast). */
export const FUTURE_YEARS = [1, 3, 5, 10] as const
export function futureValues(g: Goal, value: number): { years: number; value: number }[] {
  if (g.broken) return []
  const r = monthlyRate(g.rate)
  const out: { years: number; value: number }[] = []
  let v = value
  for (let m = 1; m <= FUTURE_YEARS[FUTURE_YEARS.length - 1] * 12; m++) {
    v = (v + g.monthly) * (1 + r)
    const y = m / 12
    if (FUTURE_YEARS.includes(y as 1)) out.push({ years: y, value: Math.round(v) })
  }
  return out
}

export interface GoalSummary {
  rows: GoalRow[]
  value: number
  invested: number
  marketEffect: number
  progress: number
  pace: Pace
  monthsLeft: number
}
export function goalSummary(g: Goal): GoalSummary {
  const rows = goalSeries(g)
  const last = rows[rows.length - 1]
  const value = last?.value ?? 0
  const invested = last?.invested ?? 0
  return {
    rows, value, invested, marketEffect: value - invested,
    progress: Math.min(100, (value / g.target) * 100),
    pace: paceFrom(g, value, NOW_IDX + (g.nov ? 1 : 0)),
    monthsLeft: Math.max(0, idx(g.targetY, g.targetM) - NOW_IDX + 1 - (g.nov ? 1 : 0)),
  }
}

export const targetLabel = (g: Goal) => `${MONTHS_SHORT[g.targetM]} ${g.targetY}`

/** Facts for a `goal_month` insight. row = null → brand-new goal with no history. */
export function goalMonthData(g: Goal, row: GoalRow | null) {
  const base = {
    goalName: g.name,
    targetAmount: g.target,
    targetLabel: targetLabel(g),
    monthlyAmount: g.monthly,
    assumedReturnPct: Math.round(g.rate * 100),
  }
  if (!row) {
    const p = paceFrom(g, 0, NOW_IDX)
    return { ...base, status: 'new', projectedDate: p.label, paceStatus: p.status, paceMonths: p.diffMonths }
  }
  const p = paceFrom(g, row.value, row.idx + 1)
  return {
    ...base,
    status: row.skipped ? 'skipped' : 'completed',
    monthLabel: row.label,
    monthName: row.monthName,
    addedThisMonth: row.added,
    pctChange: row.pct,
    marketEffect: Math.round(Math.abs(row.marketEffect)),
    netChange: Math.round(row.netChange),
    valueNow: Math.round(row.value),
    investedSoFar: row.invested,
    progressPct: Math.round(row.progress),
    projectedDate: p.label,
    paceStatus: p.status,
    paceMonths: p.diffMonths,
  }
}
export { MONTHS_LONG }

/** Facts for a `goal_summary` insight (progress, you vs market, when the Gullak can be broken). */
export function goalSummaryData(g: Goal) {
  const s = goalSummary(g)
  const base = {
    goalName: g.name, targetAmount: g.target, targetLabel: targetLabel(g), monthlyAmount: g.monthly,
    assumedReturnPct: Math.round(g.rate * 100),
  }
  if (!s.rows.length) {
    const p = paceFrom(g, 0, NOW_IDX)
    return { ...base, status: 'new', projectedDate: p.label, paceStatus: p.status, paceMonths: p.diffMonths }
  }
  const gain = s.marketEffect >= 0
  const p = s.pace
  return {
    ...base,
    status: 'active',
    valueNow: Math.round(s.value),
    progressPct: Math.round(s.progress),
    addedByYou: s.invested,
    addedByMarket: Math.round(s.marketEffect),
    marketAbs: Math.round(Math.abs(s.marketEffect)),
    marketDirection: gain ? 'gain' : 'loss',
    ...(gain ? { shareYouPct: Math.round((s.invested / s.value) * 100), shareMarketPct: Math.round((s.marketEffect / s.value) * 100) } : {}),
    monthsSaving: s.rows.length,
    streakMonths: streakOf(s.rows).streak,
    skippedMonths: streakOf(s.rows).skipped,
    fundName: g.fund,
    projectedDate: p.label,
    monthsToBreak: p.reachIdx === null ? null : Math.max(0, p.reachIdx - NOW_IDX + 1 - (g.nov ? 1 : 0)),
    moodNow: moodOf(g, s.rows),
    milestoneYear: isOneYear(s.rows),
    monthsLeftToTarget: s.monthsLeft,
    lastMonthLabel: s.rows[s.rows.length - 1].label,
    paceStatus: p.status,
    paceMonths: p.diffMonths,
  }
}

/** Consecutive paid months up to the latest one, plus the last 8 months for the tick row. */
export function streakOf(rows: GoalRow[]) {
  let streak = 0
  for (let i = rows.length - 1; i >= 0 && !rows[i].skipped; i--) streak++
  return { streak, last: rows.slice(-8), skipped: rows.filter((r) => r.skipped).length }
}

/** Facts for the cancel-SIP note about one SIP / one Gullak. */
export function cancelDataFor(g: Goal) {
  const s = goalSummary(g)
  return {
    fundName: g.fund,
    goalName: g.name,
    currentValue: Math.round(s.value),
    totalInvested: s.invested,
    monthlyAmount: g.monthly,
    sipsLeftThisYear: 2,
    year: 2026,
    pauseAvailable: true,
    targetAmount: g.target,
    targetLabel: targetLabel(g),
  }
}

/** Facts for a `gullak_broken` insight (SIP cancelled). */
export function gullakBrokenData(g: Goal) {
  const s = goalSummary(g)
  return {
    goalName: g.name, targetAmount: g.target, targetLabel: targetLabel(g), monthlyAmount: g.monthly,
    valueNow: Math.round(s.value), progressPct: Math.round(s.progress), addedByYou: s.invested,
    marketAbs: Math.round(Math.abs(s.marketEffect)), marketDirection: s.marketEffect >= 0 ? 'gain' : 'loss',
    monthsSaving: s.rows.length, monthsLeft: s.monthsLeft, fundName: g.fund,
  }
}
