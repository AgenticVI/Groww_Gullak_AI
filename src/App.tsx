import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { Risk } from '../shared/types'
import SipsScreen from './components/screens/SipsScreen'
import DetailsScreen from './components/screens/DetailsScreen'
import CancelSheet from './components/screens/CancelSheet'
import GoalsScreen from './components/screens/GoalsScreen'
import GoalDetailScreen from './components/screens/GoalDetailScreen'
import AskGullak from './components/ai/AskGullak'
import NewGoalSheet from './components/screens/NewGoalSheet'
import { SEED_GOALS, type Goal, type GoalIconKind } from './data/goals'

export type Route = 'sips' | 'details' | 'goals' | 'goal'

interface Ctx {
  risk: Risk
  setRisk: (r: Risk) => void
  aiOn: boolean
  setAiOn: (v: boolean) => void
  go: (r: Route) => void
  back: () => void
  openCancel: () => void
  toast: (msg: string) => void
  goals: Goal[]
  activeGoal: string | null
  openGoal: (id: string) => void
  openNewGoal: () => void
  askGoal: string | null
  openAsk: (id: string) => void
  closeAsk: () => void
  openSip: (id: string) => void
  openCancelFor: (id: string) => void
  route: string
  setStatus: (id: string, patch: { nov?: 'paid' | 'skipped'; broken?: boolean } | null) => void
  addGoal: (g: { name: string; icon: GoalIconKind; target: number; targetY: number; targetM: number; monthly: number; fund: string; fundShort: string }) => void
}
const AppCtx = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(AppCtx)

const load = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d } catch { return d }
}
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

export default function App() {
  const reduce = useReducedMotion()
  const [stack, setStack] = useState<Route[]>(['sips'])
  const [risk, setRiskState] = useState<Risk>(() => load<Risk>('banyan:risk', 'low'))
  const [aiOn, setAiState] = useState<boolean>(() => load<boolean>('banyan:ai', !import.meta.env.VITE_NO_API))
  const [cancelOpen, setCancelOpen] = useState(false)
  const [custom, setCustom] = useState<Goal[]>(() => load<Goal[]>('banyan:goals', []))
  const [activeGoal, setActiveGoal] = useState<string | null>(null)
  const [newGoalOpen, setNewGoalOpen] = useState(false)
  const [askGoal, setAskGoal] = useState<string | null>(null)
  const openAsk = useCallback((id: string) => setAskGoal(id), [])
  const closeAsk = useCallback(() => setAskGoal(null), [])
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const setRisk = (r: Risk) => { setRiskState(r); save('banyan:risk', r) }
  const setAiOn = (v: boolean) => { setAiState(v); save('banyan:ai', v) }
  const go = useCallback((r: Route) => setStack((s) => [...s, r]), [])
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), [])
  const toast = useCallback((m: string) => setToastMsg(m), [])
  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 2800)
    return () => clearTimeout(t)
  }, [toastMsg])

  const [status, setStatusMap] = useState<Record<string, { nov?: 'paid' | 'skipped'; broken?: boolean }>>({})
  const setStatus = useCallback((id: string, patch: { nov?: 'paid' | 'skipped'; broken?: boolean } | null) =>
    setStatusMap((m) => { const n = { ...m }; if (patch) n[id] = { ...n[id], ...patch }; else delete n[id]; return n }), [])
  const goals = useMemo(() => [...SEED_GOALS, ...custom].map((g) => ({ ...g, ...status[g.id] })), [custom, status])
  const openGoal = useCallback((id: string) => { setActiveGoal(id); setStack((st) => [...st, 'goal']) }, [])
  const openCancelFor = useCallback((id: string) => { setActiveGoal(id); setCancelOpen(true) }, [])
  const openSip = useCallback((id: string) => { setActiveGoal(id); setStack((st) => [...st, 'details']) }, [])
  const addGoal: Ctx['addGoal'] = (g) => {
    const goal: Goal = { ...g, id: `c-${Date.now()}`, startY: 2026, startM: 10, day: 7, linked: false, factor: 0.5, rate: 0.1, example: false }
    setCustom((c) => { const n = [...c, goal]; save('banyan:goals', n); return n })
    setActiveGoal(goal.id)
    setStack((st) => (st[st.length - 1] === 'goals' ? [...st, 'goal'] : [...st, 'goals', 'goal']))
  }
  const route = stack[stack.length - 1]
  const ctx = useMemo<Ctx>(
    () => ({ risk, setRisk, aiOn, setAiOn, go, back, openCancel: () => setCancelOpen(true), toast, goals, activeGoal, openGoal, openNewGoal: () => setNewGoalOpen(true), askGoal, openAsk, closeAsk, openSip, openCancelFor, route, addGoal, setStatus }),
    [risk, aiOn, go, back, toast, goals, activeGoal, askGoal, openAsk, closeAsk, openGoal, openSip, openCancelFor, route, setStatus],
  )

  return (
    <AppCtx.Provider value={ctx}>
      <div className="stage">
        <div className="phone">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={route}
              className="flex-1 flex flex-col min-h-0"
              initial={reduce ? false : { opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {route === 'sips' && <SipsScreen />}
              {route === 'details' && <DetailsScreen />}
              {route === 'goals' && <GoalsScreen />}
              {route === 'goal' && <GoalDetailScreen />}
            </motion.div>
          </AnimatePresence>

          <CancelSheet open={cancelOpen} onClose={() => setCancelOpen(false)} />
          <NewGoalSheet open={newGoalOpen} onClose={() => setNewGoalOpen(false)} />
          <AskGullak />

          {toastMsg && (
            <div role="status" className="absolute left-4 right-4 bottom-6 z-50 rounded-card bg-[#1d1f27] text-white text-[13px] font-medium px-4 py-3 shadow-lg">
              {toastMsg}
            </div>
          )}
        </div>
      </div>
    </AppCtx.Provider>
  )
}
