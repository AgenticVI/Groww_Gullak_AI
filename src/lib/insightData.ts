/** Builds the JSON "facts" sent with each insight request. All numbers computed here, never by the LLM. */
import { INSTALMENTS, GOAL, TODAY, PLANNED_MONTHS, SIP_AMOUNT, MONTHS_SHORT, type Instalment } from '../data/sip'
import {
  totals, monthEffect, totalUnitsAfter, unitsBefore, instalmentsOfYear, realYearStats, horizon,
  monthsToGoal, STRESS, ANNUAL_RETURN, latestCompleted,
} from './finance'
import { LATEST_NAV } from '../data/sip'
import { round1 } from '../../shared/format'

const r0 = (x: number) => Math.round(x)

export function monthData(i: Instalment) {
  const known = i.status === 'completed' || i.status === 'skipped'
  const prev = INSTALMENTS.filter((x) => x.n < i.n && x.status === 'completed').slice(-1)[0]
  const next = INSTALMENTS.find((x) => x.n === i.n + 1)
  const nextUnits = next
    ? next.status === 'completed' ? next.units : Math.round((SIP_AMOUNT / (next.navOrder || i.navEnd || LATEST_NAV)) * 1000) / 1000
    : 0
  const eff = known ? monthEffect(i) : 0
  const completedUpTo = INSTALMENTS.filter((x) => x.n <= i.n && x.status === 'completed').length
  return {
    monthLabel: i.label,
    monthName: i.monthLong,
    date: i.date,
    status: i.status,
    pctChange: known ? i.pct : 0,
    amountInvested: i.amount,
    navOrder: i.navOrder,
    navEnd: i.navEnd,
    unitsAllotted: i.units,
    unitsPreviousMonth: prev?.units ?? 0,
    nextUnits,
    totalUnits: Math.round(totalUnitsAfter(i.n) * 1000) / 1000,
    changeAmount: r0(Math.abs(eff)),
    instalmentsCompleted: completedUpTo,
  }
}

export function stormData(i: Instalment) {
  const t = totals()
  const prev = INSTALMENTS.filter((x) => x.n < i.n && x.status === 'completed').slice(-1)[0]
  const m = monthData(i)
  return {
    monthLabel: i.label,
    monthName: i.monthLong,
    pctChange: i.pct,
    dipAmount: m.changeAmount,
    contribution: SIP_AMOUNT,
    unitsThisMonth: i.units,
    unitsPrev: prev?.units ?? 0,
    nextUnits: m.nextUnits,
    navOrder: i.navOrder,
    navEnd: i.navEnd,
    stormMonths: t.storms,
    completedMonths: t.paid + t.skipped,
    plannedMonths: PLANNED_MONTHS,
    portfolioValue: r0(t.value),
    totalInvested: t.invested,
  }
}

export function longTermData(years: number) {
  const h = horizon(years)
  const base = monthsToGoal()
  const stress = monthsToGoal(GOAL.amount, STRESS)
  return {
    horizonYears: years,
    assumedReturnPct: ANNUAL_RETURN * 100,
    monthlyAmount: SIP_AMOUNT,
    projectedValue: r0(h.value),
    investedAtHorizon: h.invested,
    gain: r0(h.gain),
    byLabel: h.byLabel,
    goalAmount: GOAL.amount,
    goalLabel: GOAL.label,
    goalBaseDate: base.label,
    goalStressDate: stress.label,
    delayMonths: Math.max(0, stress.index - base.index),
    stressYear: STRESS.year,
    stressDropPct: Math.abs(STRESS.annual * 100),
    note: 'Projection is an illustration at an assumed rate, not a forecast.',
  }
}

export function cancelData() {
  const t = totals()
  const left = INSTALMENTS.filter((x) => x.year === TODAY.year && (x.status === 'inprogress' || x.status === 'upcoming')).length
  return {
    unitsHeld: Math.round(t.units * 1000) / 1000,
    currentValue: r0(t.value),
    totalInvested: t.invested,
    monthlyAmount: SIP_AMOUNT,
    sipsLeftThisYear: left,
    year: TODAY.year,
    pauseAvailable: true,
    goalAmount: GOAL.amount,
    goalLabel: GOAL.label,
  }
}

export function yearStoryData(year: number) {
  const list = instalmentsOfYear(year)
  const known = list.filter((i) => i.status === 'completed' || i.status === 'skipped')
  const best = [...known].sort((a, b) => b.pct - a.pct)[0]
  const stats = realYearStats(year)
  return {
    year,
    complete: stats.complete,
    paid: stats.paid,
    total: stats.total,
    skipped: stats.skipped,
    bestMonth: best.monthLong,
    bestPct: best.pct,
    storms: known.filter((i) => i.pct < 0).map((i) => ({ month: MONTHS_SHORT[i.month], pct: i.pct })),
    stormCount: known.filter((i) => i.pct < 0).length,
    invested: stats.invested,
    totalInvestedToDate: INSTALMENTS.filter((i) => i.year <= year && i.status === 'completed').reduce((a, i) => a + i.amount, 0),
    valueAtYearEnd: r0(stats.value),
  }
}
export { round1, latestCompleted, unitsBefore }
