export type InsightType =
  | 'month_whisper'
  | 'storm_perspective'
  | 'long_term'
  | 'cancel_check'
  | 'year_story'
  | 'goal_month'
  | 'goal_summary'
  | 'gullak_broken'
export type Risk = 'low' | 'medium'
export type InsightIcon = 'storm' | 'coin' | 'leaf'

export interface Insight {
  title: string
  icon: InsightIcon
  bullets: string[]
}
export interface InsightRequest {
  type: InsightType
  data: Record<string, any>
  riskAppetite: Risk
}
export interface InsightResponse {
  insight: Insight
  source: 'ai' | 'template'
  reason?: string
}
export const INSIGHT_TYPES: InsightType[] = [
  'month_whisper',
  'storm_perspective',
  'long_term',
  'cancel_check',
  'year_story',
  'goal_month',
  'goal_summary',
  'gullak_broken',
]
