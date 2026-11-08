export type GoalIconKind = 'bike' | 'trip' | 'shield' | 'home' | 'phone' | 'edu'

/** One Goal Gullak = one SIP = one mutual fund. */
export interface Goal {
  id: string
  name: string
  icon: GoalIconKind
  target: number
  targetY: number
  targetM: number // 0-11
  monthly: number
  day: number // SIP date of month
  fund: string // full scheme name
  fundShort: string
  startY: number
  startM: number
  /** true = fed by the real ICICI SIP history (units & NAV); false = illustrative example contributions */
  linked: boolean
  /** share of the real fund's monthly move this example SIP feels */
  factor: number
  /** assumed annual return used only for the pace illustration */
  rate: number
  example: boolean
  /** months (year*12+month) in which the instalment was missed */
  skips?: number[]
  /** demo events this month (Nov 2026) */
  nov?: 'paid' | 'skipped'
  /** SIP cancelled: the Gullak is broken */
  broken?: boolean
}

export const SAMPLE_FUNDS = [
  { fund: 'Parag Parikh Flexi Cap Fund Direct Growth', short: 'Parag Parikh Flexi Cap' },
  { fund: 'HDFC Index Fund Nifty 50 Plan Direct Growth', short: 'HDFC Nifty 50 Index' },
  { fund: 'Mirae Asset ELSS Tax Saver Fund Direct Growth', short: 'Mirae Asset ELSS' },
  { fund: 'Axis Small Cap Fund Direct Growth', short: 'Axis Small Cap' },
]

// A first-time investor: two long-term goals, each fed by its own SIP in one fund, both started within the last year.
// Fund names are for illustration; contributions are made-up and the monthly moves follow the sample fund history.
export const SEED_GOALS: Goal[] = [
  // Twelve paid months already: shows the one-year milestone (party popper) from the start.
  { id: 'retire', name: 'Retirement', icon: 'shield', target: 5000000, targetY: 2046, targetM: 11, monthly: 5000, day: 1,
    fund: 'HDFC Index Fund Nifty 50 Plan Direct Growth', fundShort: 'HDFC Nifty 50 Index',
    startY: 2025, startM: 10, linked: false, factor: 0.85, rate: 0.1, example: true },
  { id: 'home', name: 'Dream home', icon: 'home', target: 800000, targetY: 2040, targetM: 11, monthly: 2000, day: 3,
    fund: 'ICICI Prudential Nifty Next 50 Index Direct Growth', fundShort: 'ICICI Pru Nifty Next 50',
    startY: 2025, startM: 11, linked: false, factor: 1, rate: 0.1, example: true, skips: [2026 * 12 + 5] },
  { id: 'edu', name: "Child's education", icon: 'edu', target: 1000000, targetY: 2042, targetM: 11, monthly: 3000, day: 5,
    fund: 'Parag Parikh Flexi Cap Fund Direct Growth', fundShort: 'Parag Parikh Flexi Cap',
    startY: 2026, startM: 8, linked: false, factor: 0.7, rate: 0.1, example: true },
]
