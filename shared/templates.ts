import type { Insight, InsightType, Risk } from './types'
import { inr, inrDec, pctAbs, pctSigned, unitsFmt } from './format'

/**
 * Pre-written insights built from the SAME numbers the LLM gets.
 * Used when AI is off, the call fails / times out, or the output fails validation.
 * Every bullet is <= 22 words, advice-free and uses only numbers present in `data`.
 */
type D = Record<string, any>
const pick = (risk: Risk, low: string, med: string) => (risk === 'low' ? low : med)

function monthWhisper(d: D, risk: Risk): Insight {
  const name = d.monthName as string
  if (d.status === 'skipped') {
    return {
      title: 'A resting leaf',
      icon: 'leaf',
      bullets: [
        `No ${inr(d.amountInvested)} went in for ${d.monthLabel}, so this leaf rests and no units were added.`,
        `The fund moved ${pctSigned(d.pctChange)} that month, changing your existing holding by about ${inr(d.changeAmount)}.`,
        pick(
          risk,
          `Your tree still stands with ${unitsFmt(d.totalUnits)} units; one resting leaf sits beside ${d.instalmentsCompleted} grown ones.`,
          `You still hold ${unitsFmt(d.totalUnits)} units across ${d.instalmentsCompleted} completed instalments.`,
        ),
      ],
    }
  }
  if (d.status === 'inprogress' || d.status === 'upcoming') {
    return {
      title: 'A leaf yet to grow',
      icon: 'leaf',
      bullets: [
        `${d.monthLabel} has no market result yet, so this leaf is still waiting to grow.`,
        `Your ${inr(d.amountInvested)} SIP is scheduled for ${d.date}.`,
      ],
    }
  }
  if (d.pctChange < 0) {
    return {
      title: `${name}'s storm`,
      icon: 'storm',
      bullets: [
        `${name} was stormy: the fund fell ${pctAbs(d.pctChange)}, taking about ${inr(d.changeAmount)} off your holding's value.`,
        `NAV ended the month at ${inrDec(d.navEnd)}, so the next ${inr(d.amountInvested)} SIP gets about ${unitsFmt(d.nextUnits)} units, against ${unitsFmt(d.unitsAllotted)} this month.`,
        pick(
          risk,
          `One stormy month is a small part of a long journey; you have completed ${d.instalmentsCompleted} instalments and hold ${unitsFmt(d.totalUnits)} units.`,
          `You still hold ${unitsFmt(d.totalUnits)} units after ${d.instalmentsCompleted} instalments; a dip changes today's value, not the units you own.`,
        ),
      ],
    }
  }
  return {
    title: `${name}'s sunshine`,
    icon: 'coin',
    bullets: [
      `${name} was sunny: the fund rose ${pctAbs(d.pctChange)}, adding about ${inr(d.changeAmount)} to your holding's value.`,
      `Your ${inr(d.amountInvested)} SIP picked up ${unitsFmt(d.unitsAllotted)} units at ${inrDec(d.navOrder)}, taking you to ${unitsFmt(d.totalUnits)} units in total.`,
      pick(
        risk,
        'Sunny months come and go; your tree is measured by steady leaves, not by any single month.',
        'A good month is welcome, though markets move both ways and past months do not predict future ones.',
      ),
    ],
  }
}

function stormPerspective(d: D, risk: Risk): Insight {
  return {
    title: `Weathering ${d.monthName}`,
    icon: 'storm',
    bullets: [
      pick(
        risk,
        `${d.monthName} fell ${pctAbs(d.pctChange)}, about ${inr(d.dipAmount)} on paper, while your SIP added ${inr(d.contribution)} to your savings.`,
        `${d.monthName} fell ${pctAbs(d.pctChange)}, about ${inr(d.dipAmount)} on paper; your SIP added ${inr(d.contribution)} that month.`,
      ),
      `Only ${d.stormMonths} of your ${d.completedMonths} months so far were stormy, within ${d.plannedMonths} months planned for your goal.`,
      `A lower NAV means each ${inr(d.contribution)} gets more units: about ${unitsFmt(d.nextUnits)} units next month, against ${unitsFmt(d.unitsThisMonth)} in ${d.monthName}.`,
    ],
  }
}

function longTerm(d: D, risk: Risk): Insight {
  const delayed =
    d.delayMonths > 0
      ? `Stress test: if ${d.stressYear} fell ${d.stressDropPct}%, your ${inr(d.goalAmount)} mark moves from ${d.goalBaseDate} to ${d.goalStressDate}: delayed by ${d.delayMonths} months, not lost.`
      : `Stress test: if ${d.stressYear} fell ${d.stressDropPct}%, your ${inr(d.goalAmount)} mark stays near ${d.goalBaseDate}.`
  return {
    title: `Your ${d.horizonYears}-year view`,
    icon: 'coin',
    bullets: [
      `As an illustration, ${inr(d.monthlyAmount)} a month could grow to about ${inr(d.projectedValue)} by ${d.byLabel}, from ${inr(d.investedAtHorizon)} put in.`,
      delayed,
      pick(
        risk,
        'This is an illustration at an assumed rate, not a forecast; real returns can be higher or lower.',
        'An illustration, not a forecast: real returns can be higher or lower, and your monthly SIP keeps adding up.',
      ),
    ],
  }
}

function cancelCheck(d: D, risk: Risk): Insight {
  return {
    title: 'What stays, what stops',
    icon: 'leaf',
    bullets: [
      `The ${inr(d.totalInvested)} you've put in, now worth about ${inr(d.currentValue)}, stays invested even if future instalments stop.`,
      `Stopping this SIP ends ${inr(d.monthlyAmount)} a month toward ${d.goalName}; ${d.sipsLeftThisYear} instalments are still due in ${d.year}.`,
      pick(
        risk,
        'A pause option also exists; it holds instalments for a while without closing your SIP.',
        'A pause option also exists, which holds instalments for a while without closing your SIP.',
      ),
    ],
  }
}

function yearStory(d: D, risk: Risk): Insight {
  const storms = (d.storms as { month: string; pct: number }[]) ?? []
  const stormLine = storms.length
    ? `${storms.length === 1 ? 'One stormy month' : `${storms.length} stormy months`} came through (${storms
        .map((s) => `${s.month} ${pctSigned(s.pct)}`)
        .join(', ')}), and the tree kept growing.`
    : `No stormy months in ${d.year}${d.complete ? '' : ' so far'}; every month the fund rose.`
  return {
    title: d.complete ? `Your ${d.year} story` : `Your ${d.year} so far`,
    icon: 'leaf',
    bullets: [
      `Best month: ${d.bestMonth}, with ${pctSigned(d.bestPct)}, the sunniest leaf of ${d.year}.`,
      stormLine,
      `${d.paid} of ${d.total} SIPs paid${d.skipped ? ` and ${d.skipped} skipped` : ''}; in total ${inr(d.totalInvestedToDate)} invested is worth about ${inr(d.valueAtYearEnd)}${d.complete ? ' at year end' : ' now'}.`,
    ],
  }
}

function paceLine(d: D): string {
  if (!d.projectedDate) return `At ${inr(d.monthlyAmount)} a month, this Gullak has no projected date yet.`
  const n = Math.abs(d.paceMonths)
  const rel = d.paceStatus === 'ahead' ? `${n} months ahead of ${d.targetLabel}` : d.paceStatus === 'behind' ? `${n} months after ${d.targetLabel}` : `close to your ${d.targetLabel} date`
  return `At ${inr(d.monthlyAmount)} a month, as an illustration, the goal lands around ${d.projectedDate}: ${rel}.`
}

function goalMonth(d: D, risk: Risk): Insight {
  if (d.status === 'new') {
    return {
      title: 'A new Gullak',
      icon: 'leaf',
      bullets: [
        `${d.goalName} aims for ${inr(d.targetAmount)} by ${d.targetLabel}; nothing has gone in yet.`,
        paceLine(d),
      ],
    }
  }
  const head =
    d.status === 'skipped'
      ? `No instalment went into ${d.goalName} in ${d.monthName}; the Gullak stands at ${inr(d.valueNow)}, or ${d.progressPct}% of ${inr(d.targetAmount)}.`
      : `${d.monthName}: ${inr(d.addedThisMonth)} went into your ${d.goalName} Gullak, taking it to ${inr(d.valueNow)}, or ${d.progressPct}% of ${inr(d.targetAmount)}.`
  const up = d.pctChange >= 0
  const market = up
    ? pick(
        risk,
        `Markets were up ${pctAbs(d.pctChange)}, adding about ${inr(d.marketEffect)}; the Gullak grew by ${inr(d.netChange)} in all.`,
        `Markets were up ${pctAbs(d.pctChange)}, adding about ${inr(d.marketEffect)} on top of what you put in.`,
      )
    : pick(
        risk,
        `Markets fell ${pctAbs(d.pctChange)}, trimming about ${inr(d.marketEffect)} on paper; what you put in still counts toward the goal.`,
        `Markets fell ${pctAbs(d.pctChange)}, trimming about ${inr(d.marketEffect)} from the Gullak's value that month.`,
      )
  return {
    title: `${d.monthName} · ${d.goalName}`,
    icon: d.status === 'skipped' ? 'leaf' : up ? 'coin' : 'storm',
    bullets: [head, market, paceLine(d)],
  }
}

function gullakBroken(d: D): Insight {
  const gain = d.marketDirection === 'gain'
  return {
    title: `${d.goalName} Gullak is breaking`,
    icon: 'storm',
    bullets: [
      `This ends the ${inr(d.monthlyAmount)} a month going toward ${d.goalName}, after ${d.monthsSaving} months of saving.`,
      `The Gullak held ${inr(d.valueNow)}, just ${d.progressPct}% of ${inr(d.targetAmount)}, with ${d.monthsLeft} months left until ${d.targetLabel}.`,
      gain
        ? `${inr(d.addedByYou)} was yours and ${inr(d.marketAbs)} came from the market, and its growth ends here.`
        : `${inr(d.addedByYou)} was yours; the market had taken ${inr(d.marketAbs)} off, and the Gullak no longer grows.`,
    ],
  }
}

function goalSummary(d: D, risk: Risk): Insight {
  if (d.status === 'new') return goalMonth(d, risk)
  const gain = d.marketDirection === 'gain'
  const rel =
    d.paceStatus === 'ahead' ? `running ${Math.abs(d.paceMonths)} months ahead of ${d.targetLabel}`
    : d.paceStatus === 'behind' ? `running ${Math.abs(d.paceMonths)} months behind ${d.targetLabel}`
    : d.paceStatus === 'reached' ? 'already reached' : `close to your ${d.targetLabel} date`
  const split = gain
    ? `${inr(d.addedByYou)} came from you and ${inr(d.marketAbs)} from the market, so your own money is ${d.shareYouPct}% of the Gullak.`
    : `${inr(d.addedByYou)} came from you; the market has taken ${inr(d.marketAbs)} off so far, on paper.`
  const sad = d.moodNow === 'sad'
  if (!gain) {
    const calm = [
      sad
        ? `${d.lastMonthLabel} was skipped and the market is ${inr(d.marketAbs)} below your ${inr(d.addedByYou)} on paper, a small dip.`
        : `The market is ${inr(d.marketAbs)} below your ${inr(d.addedByYou)} on paper, a small, usual dip with ${d.monthsLeftToTarget} months to go.`,
      `Markets have often recovered over long periods, though that is no promise, and each instalment buys more units at low prices.`,
      d.projectedDate
        ? `As an illustration, ${inr(d.monthlyAmount)} a month still reaches ${inr(d.targetAmount)} around ${d.projectedDate}.`
        : `A date for reaching ${inr(d.targetAmount)} is not available at the current monthly amount.`,
    ]
    return { title: d.milestoneYear ? `${d.goalName} Gullak turns one year` : sad ? `${d.goalName} Gullak is resting` : `${d.goalName} Gullak is taking a breather`, icon: 'leaf', bullets: calm }
  }
  return {
    title: d.milestoneYear ? `${d.goalName} Gullak turns one year` : sad ? `${d.goalName} Gullak feels sad` : `${d.goalName} Gullak is smiling`,
    icon: sad ? 'storm' : gain ? 'coin' : 'storm',
    bullets: [
      d.milestoneYear
        ? `A full year is done: ${d.monthsSaving} months of saving, ${inr(d.addedByYou)} from you, and the Gullak now holds ${inr(d.valueNow)}.`
      : sad
        ? `${d.lastMonthLabel} was skipped, so only ${inr(d.addedByYou)} has gone in; the Gullak holds ${inr(d.valueNow)}, ${d.progressPct}% of ${inr(d.targetAmount)}.`
        : `Your Gullak holds ${inr(d.valueNow)}, or ${d.progressPct}% of ${inr(d.targetAmount)}, ${rel}.`,
      pick(risk, split, split),
      d.projectedDate
        ? `As an illustration, you could break this Gullak around ${d.projectedDate}, ${d.monthsToBreak} months from now.`
        : 'There is no projected date for breaking this Gullak at the current monthly amount.',
    ],
  }
}

export function buildTemplate(type: InsightType, data: D, risk: Risk): Insight {
  switch (type) {
    case 'month_whisper': return monthWhisper(data, risk)
    case 'storm_perspective': return stormPerspective(data, risk)
    case 'long_term': return longTerm(data, risk)
    case 'cancel_check': return cancelCheck(data, risk)
    case 'year_story': return yearStory(data, risk)
    case 'goal_month': return goalMonth(data, risk)
    case 'goal_summary': return goalSummary(data, risk)
    case 'gullak_broken': return gullakBroken(data)
  }
}
