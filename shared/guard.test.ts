import test from 'node:test'
import assert from 'node:assert/strict'
import { findAdvice, findInventedNumber, validateInsight } from './guard'

const data = { pctChange: -3.4, changeAmount: 282, amountInvested: 2000, goalAmount: 100000, monthLabel: 'June 2026', totalUnits: 121.792 }

test('accepts grounded output', () => {
  const v = validateInsight(
    { title: "June's storm", icon: 'storm', bullets: ['The fund fell 3.4%, about ₹282 on paper.', 'Your ₹2,000 SIP still added 24.343 units? no'] },
    data,
  )
  assert.equal(v.ok, false) // 24.343 is invented
})
test('accepts when all numbers exist', () => {
  const v = validateInsight(
    { title: "June's storm", icon: 'storm', bullets: ['June 2026 fell 3.4%, about ₹282 on paper.', 'Your ₹2,000 SIP keeps adding units; you hold 121.792.'] },
    data,
  )
  assert.equal(v.ok, true)
})
test('rejects invented rupee / percent', () => {
  assert.ok(findInventedNumber('Lost ₹500 this month', data))
  assert.ok(findInventedNumber('Fell 9.9%', data))
  assert.equal(findInventedNumber('Fell −3.4% or about ₹282', data), null)
})
test('blocks advice and promises', () => {
  for (const t of ['You should invest more', 'Buy the dip', 'Stop your SIP now', 'Returns are guaranteed', 'Consider pausing', 'It will double', 'Cancel it.', 'Worth ₹1 lakh'])
    assert.ok(findAdvice(t), t)
})
test('allows neutral explanation', () => {
  for (const t of ['A SIP gets more units when NAV is lower', 'Units you hold stay invested', 'A pause option exists', 'Stopping would end the monthly debit'])
    assert.equal(findAdvice(t), null, t)
})
test('rejects bad shape', () => {
  assert.equal(validateInsight({ title: 'x', icon: 'sun', bullets: ['a', 'b'] }, {}).ok, false)
  assert.equal(validateInsight({ title: 'x', icon: 'leaf', bullets: ['a'] }, {}).ok, false)
  assert.equal(validateInsight({ title: 'x', icon: 'leaf', bullets: ['a b c d e f g h i j k l m n o p q r s t u v w', 'b'] }, {}).ok, false)
})
