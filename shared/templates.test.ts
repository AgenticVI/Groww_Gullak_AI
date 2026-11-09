import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTemplate } from './templates'
import { validateInsight } from './guard'
import { INSTALMENTS } from '../src/data/sip'
import { monthData, stormData, longTermData, yearStoryData } from '../src/lib/insightData'
import { cancelDataFor } from '../src/lib/goals'
import { SEED_GOALS as SG } from '../src/data/goals'
import { totals, monthsToGoal, STRESS, horizon } from '../src/lib/finance'
import { GOAL } from '../src/data/sip'

const risks = ['low', 'medium'] as const

test('mock data is internally consistent', () => {
  const t = totals()
  assert.equal(INSTALMENTS.filter((i) => i.status === 'skipped').length, 1)
  const neg = INSTALMENTS.filter((i) => (i.status === 'completed' || i.status === 'skipped') && i.pct < 0)
  assert.ok(neg.length >= 2 && neg.length <= 3, `negatives: ${neg.length}`)
  assert.equal(INSTALMENTS.filter((i) => i.status === 'completed').length, 21)
  assert.ok(Math.abs(t.value - t.units * t.nav) < 1e-6)
  for (const i of INSTALMENTS.filter((x) => x.status === 'completed')) assert.equal(i.units, Math.round((2000 / i.navOrder) * 1000) / 1000)
  console.log('totals', t, 'goal base/stress', monthsToGoal().label, monthsToGoal(GOAL.amount, STRESS).label, 'h10', Math.round(horizon(10).value))
})

test('every template passes the same validator as AI output', () => {
  const cases: [any, any][] = []
  for (const i of INSTALMENTS) cases.push(['month_whisper', monthData(i)])
  for (const i of INSTALMENTS.filter((x) => x.pct < 0 && x.status !== 'upcoming')) cases.push(['storm_perspective', stormData(i)])
  for (const y of [3, 5, 10]) cases.push(['long_term', longTermData(y)])
  for (const g of SG) cases.push(['cancel_check', cancelDataFor(g)])
  cases.push( ['year_story', yearStoryData(2025)], ['year_story', yearStoryData(2026)])
  for (const [type, data] of cases)
    for (const r of risks) {
      const ins = buildTemplate(type, data, r)
      const v = validateInsight(ins, data, type)
      assert.ok(v.ok, `${type} ${r} ${(data as any).monthLabel ?? ''}: ${!v.ok ? v.reason : ''}\n${JSON.stringify(ins)}`)
    }
})

test('low vs medium change tone but not numbers', () => {
  const d = stormData(INSTALMENTS[21])
  const a = buildTemplate('storm_perspective', d, 'low').bullets.join(' ')
  const b = buildTemplate('storm_perspective', d, 'medium').bullets.join(' ')
  assert.notEqual(a, b)
  const nums = (s: string) => (s.match(/\d+(?:,\d+)*(?:\.\d+)?/g) ?? []).join('|')
  assert.equal(nums(a), nums(b))
})

import { SEED_GOALS } from '../src/data/goals'
import { goalSeries, goalMonthData, goalSummary } from '../src/lib/goals'

test('goal_month templates pass validator for every goal and month (both tones)', () => {
  const extra = { ...SEED_GOALS.find((g) => g.id === 'edu')!, id: 'x', name: 'Laptop', startY: 2026, startM: 10 }
  for (const g of [...SEED_GOALS, extra]) {
    const rows = goalSeries(g)
    const cases = rows.length ? rows.map((r) => goalMonthData(g, r)) : [goalMonthData(g, null)]
    for (const d of cases) for (const r of risks) {
      const ins = buildTemplate('goal_month', d, r)
      const v = validateInsight(ins, d, 'goal_month')
      assert.ok(v.ok, `${g.name} ${(d as any).monthLabel}: ${!v.ok ? v.reason : ''}\n${JSON.stringify(ins)}`)
    }
  }
  const s = SEED_GOALS.map((g) => ({ n: g.name, v: Math.round(goalSummary(g).value), p: Math.round(goalSummary(g).progress), pace: goalSummary(g).pace }))
  console.log(JSON.stringify(s))
  assert.ok(SEED_GOALS.every((g) => goalSeries(g).length <= 12)) // first-time investor: under a year
})

import { goalSummaryData } from '../src/lib/goals'
test('goal_summary templates validate (both tones, incl. new goal)', () => {
  const extra = { ...SEED_GOALS.find((g) => g.id === 'edu')!, id: 'x', name: 'Laptop', startY: 2026, startM: 10 }
  for (const g of [...SEED_GOALS, extra]) for (const r of risks) {
    const d = goalSummaryData(g)
    const ins = buildTemplate('goal_summary', d, r)
    const v = validateInsight(ins, d, 'goal_summary')
    assert.ok(v.ok, `${g.name}: ${!v.ok ? v.reason : ''}\n${JSON.stringify(ins)}`)
  }
  console.log(JSON.stringify(buildTemplate('goal_summary', goalSummaryData(SEED_GOALS.find((g) => g.id === 'edu')!), 'low')))
})

import { gullakBrokenData } from '../src/lib/goals'
test('mood: paid/skipped/broken insights validate', () => {
  for (const nov of ['paid', 'skipped'] as const) for (const r of risks) {
    const g = { ...SEED_GOALS.find((g) => g.id === 'home')!, nov }
    const d = goalSummaryData(g)
    assert.equal((d as any).moodNow, nov === 'paid' ? 'happy' : 'sad')
    const v = validateInsight(buildTemplate('goal_summary', d, r), d, 'goal_summary')
    assert.ok(v.ok, nov + (!v.ok ? v.reason : ''))
  }
  for (const g of SEED_GOALS) {
    const d = gullakBrokenData({ ...g, broken: true })
    const ins = buildTemplate('gullak_broken', d, 'low')
    const v = validateInsight(ins, d, 'gullak_broken')
    assert.ok(v.ok, `${!v.ok ? v.reason : ''} ${JSON.stringify(ins)}`)
  }
})
