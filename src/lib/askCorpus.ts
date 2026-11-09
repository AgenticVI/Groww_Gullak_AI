import type { Goal } from '../data/goals'
import type { Chunk } from '../../shared/rag'
import { goalSummary, moodOf, streakOf, targetLabel, futureValues } from './goals'
import { inr } from '../../shared/format'

const pct = (n: number) => `${Math.abs(n).toFixed(1)}%`

/**
 * The knowledge base for ONE Gullak. Every chunk is a plain-sentence fact built from the goal's own maths,
 * so the chatbot can only ever know this goal. Numbers come from code, never from the model.
 */
export function buildCorpus(g: Goal): Chunk[] {
  const s = goalSummary(g)
  const rows = s.rows
  const last = rows[rows.length - 1]
  const gain = s.marketEffect >= 0
  const st = streakOf(rows)
  const mood = moodOf(g, rows)
  const out: Chunk[] = []
  const add = (id: string, title: string, text: string) => out.push({ id, title, text })

  add('overview', 'Goal overview',
    `${g.name} Gullak is a goal of ${inr(g.target)} by ${targetLabel(g)}. The SIP is ${inr(g.monthly)} a month on day ${g.day}, in ${g.fund}.`)

  if (!rows.length) {
    add('new', 'No contributions yet', `Nothing has gone into this Gullak yet. The first instalment of ${inr(g.monthly)} is yet to land, so there is no progress or streak to show.`)
    return out
  }

  add('progress', 'Progress value so far how far',
    `The Gullak holds ${inr(s.value)}, about ${Math.round(s.progress)}% of the ${inr(g.target)} goal so far, after ${rows.length} months of saving.`)
  add('split', 'You versus market added returns gain',
    `You have added ${inr(s.invested)} yourself. The market ${gain ? `has added ${inr(s.marketEffect)} on top` : `has moved it down by ${inr(Math.abs(s.marketEffect))} so far, which is a small dip on paper`}. The market part moves up and down; your instalments are the part you control.`)

  if (s.pace.status === 'reached') add('pace', 'When break reach target', `The target of ${inr(g.target)} is reached, so this Gullak can be broken now.`)
  const fv = futureValues(g, s.value)
  if (fv.length)
    add('future', 'Future coming years next how much could it be in 1 3 5 10 years projected value',
      `Illustration only: if your ${inr(g.monthly)} instalments continue, this Gullak could be about ${fv.map((f) => `${inr(f.value)} in ${f.years} ${f.years === 1 ? 'year' : 'years'}`).join(', ')}. This is not a promise and the real value will differ.`)

  add('streak', 'Streak discipline consistent paid consecutive',
    `Your streak is ${st.streak} ${st.streak === 1 ? 'month' : 'months'} in a row. Of ${rows.length} months, ${rows.length - st.skipped} were paid and ${st.skipped} ${st.skipped === 1 ? 'was' : 'were'} skipped.`)
  add('mood', 'Gullak mood happy sad',
    g.broken ? `The Gullak is broken because the SIP was cancelled. What it holds stays at ${inr(s.value)}.`
      : mood === 'sad' ? `The Gullak is sad because the ${last.monthName} instalment was skipped. Paying the next instalment makes it happy again.`
      : `The Gullak is happy because the ${last.monthName} instalment is paid.`)

  add('latest', 'Latest last recent month this month',
    `${last.label}: ${last.skipped ? `the ${inr(g.monthly)} instalment was skipped` : `you added ${inr(last.added)}`}, the market moved ${last.pct >= 0 ? '+' : '−'}${pct(last.pct)} (${last.marketEffect >= 0 ? '+' : '−'}${inr(Math.abs(last.marketEffect))}), and the Gullak value is ${inr(last.value)}.`)

  const paid = rows.filter((r) => !r.skipped)
  if (paid.length) {
    const best = [...rows].sort((a, b) => b.pct - a.pct)[0]
    const worst = [...rows].sort((a, b) => a.pct - b.pct)[0]
    add('extremes', 'Best highest worst lowest month',
      `The best month was ${best.label} at ${best.pct >= 0 ? '+' : '−'}${pct(best.pct)}. The weakest month was ${worst.label} at ${worst.pct >= 0 ? '+' : '−'}${pct(worst.pct)}.`)
  }
  const dips = rows.filter((r) => r.pct < 0)
  if (dips.length)
    add('dips', 'Dip fall down loss months',
      `${dips.length} of ${rows.length} months had a dip: ${dips.slice(-4).map((r) => `${r.label} (${r.pct >= 0 ? '+' : '−'}${pct(r.pct)})`).join(', ')}. Each instalment buys more units while prices are low, and units are what the Gullak holds.`)

  add('history', 'What happened till now summary history',
    `Since ${rows[0].label} you have added ${inr(s.invested)} over ${rows.length} months and the Gullak now holds ${inr(s.value)}. ${gain ? `The market added ${inr(s.marketEffect)}.` : `The market is down ${inr(Math.abs(s.marketEffect))} on paper.`} Your streak is ${st.streak} ${st.streak === 1 ? 'month' : 'months'}.`)

  for (const r of rows)
    add(`month-${r.key}`, `${r.monthName} ${r.monthShort} ${r.label}`,
      `${r.label}: ${r.skipped ? `instalment skipped, so ${inr(0)} was added` : `you added ${inr(r.added)}`}. The market moved ${r.pct >= 0 ? '+' : '−'}${pct(r.pct)}, which is ${r.marketEffect >= 0 ? '+' : '−'}${inr(Math.abs(r.marketEffect))}. The Gullak value became ${inr(r.value)}, ${Math.round(r.progress)}% of the goal.`)

  add('units', 'How units NAV SIP works explained',
    `A SIP puts the same amount in every month. When the fund price (NAV) is lower you get more units, when it is higher you get fewer. The Gullak value is your units times the latest NAV, so it moves with the market.`)
  add('fund', 'Fund scheme', `This Gullak is linked to one SIP in ${g.fund}.`)
  add('cancel', 'Cancel stop pause SIP what happens',
    g.broken ? `The SIP is already cancelled, so this Gullak is broken and stops growing. What it holds stays at ${inr(s.value)}.`
      : `Cancelling the SIP breaks this Gullak and stops it growing, and what it holds stays at ${inr(s.value)}. A pause instead keeps your savings in place and shows the Gullak with a crack. Both options are on the SIP details screen.`)
  add('streak-how', 'How the streak and mood work',
    `A paid month adds one to the streak and keeps the Gullak happy. A skipped month resets the streak and makes the Gullak sad. After 12 paid months a party popper shows up as a one year milestone.`)
  return out
}
