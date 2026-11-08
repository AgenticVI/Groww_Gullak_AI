/** Mock SIP history. All derived numbers are computed here / in lib/finance.ts, never by the LLM. */
export type InstStatus = 'completed' | 'skipped' | 'inprogress' | 'upcoming'

export interface Instalment {
  n: number
  year: number
  month: number // 0-11
  monthKey: string // 2026-06
  monthShort: string
  monthLong: string
  label: string // "June 2026"
  date: string // "03 Jun 2026"
  amount: number
  status: InstStatus
  navOrder: number // NAV on order date
  navEnd: number // NAV at month end (== next month's order NAV); 0 when not yet known
  units: number // 3 decimals, 0 if skipped / not yet allotted
  pct: number // fund % change that month (1 decimal); 0 when not yet known
}

export const FUND = {
  name: 'ICICI Prudential Nifty Next 50 Index Direct Growth',
  short: 'ICICI Prudential Nifty Next 50 Index',
  plan: 'Direct · Growth · Index fund',
}
export const SIP_AMOUNT = 2000
export const SIP_DAY = 3
export const START = { year: 2025, month: 0 }
export const GOAL = { amount: 100000, label: 'Dec 2030', year: 2030, month: 11 }
export const TODAY = { year: 2026, month: 10, label: '03 Nov 2026', short: 'Nov 2026' } // 23rd instalment in progress
export const PLANNED_MONTHS = (GOAL.year - START.year) * 12 + (GOAL.month - START.month) + 1 // Jan 2025 → Dec 2030

export const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const MONTHS_SHORT = MONTHS_LONG.map((m) => m.slice(0, 3))

// Fund % move over each month, Jan 2025 → Oct 2026 (22 months). Three negative months.
const PCT_PLAN = [
  1.5, 2.2, -4.1, 3.8, 4.6, 2.1, 1.4, 3.2, 1.9, 2.8, 1.1, 2.4, // 2025
  3.1, 1.7, 2.6, 2.9, 1.6, -3.4, 2.2, 1.3, 1.8, -1.8, // 2026 Jan–Oct
]
const SKIPPED_N = 5 // May 2025

const r2 = (x: number) => Math.round(x * 100) / 100
const r3 = (x: number) => Math.round(x * 1000) / 1000

function build(): { list: Instalment[]; latestNav: number } {
  const list: Instalment[] = []
  let nav = 54.2
  for (let i = 0; i < 24; i++) {
    const n = i + 1
    const year = START.year + Math.floor((START.month + i) / 12)
    const month = (START.month + i) % 12
    const base = {
      n,
      year,
      month,
      monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
      monthShort: MONTHS_SHORT[month],
      monthLong: MONTHS_LONG[month],
      label: `${MONTHS_LONG[month]} ${year}`,
      date: `${String(SIP_DAY).padStart(2, '0')} ${MONTHS_SHORT[month]} ${year}`,
      amount: SIP_AMOUNT,
    }
    if (n <= 22) {
      const navOrder = nav
      const navEnd = r2(navOrder * (1 + PCT_PLAN[i] / 100))
      const pct = Math.round(((navEnd / navOrder - 1) * 100) * 10) / 10
      const skipped = n === SKIPPED_N
      list.push({
        ...base,
        status: skipped ? 'skipped' : 'completed',
        navOrder,
        navEnd,
        units: skipped ? 0 : r3(SIP_AMOUNT / navOrder),
        pct,
      })
      nav = navEnd
    } else if (n === 23) {
      list.push({ ...base, status: 'inprogress', navOrder: nav, navEnd: 0, units: 0, pct: 0 })
    } else {
      list.push({ ...base, status: 'upcoming', navOrder: 0, navEnd: 0, units: 0, pct: 0 })
    }
  }
  return { list, latestNav: nav }
}

const built = build()
export const INSTALMENTS: Instalment[] = built.list
export const LATEST_NAV = built.latestNav
