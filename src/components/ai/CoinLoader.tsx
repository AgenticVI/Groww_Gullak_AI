import { useEffect, useState } from 'react'

const STEPS = ['Counting your coins…', 'Reading your Gullak facts…', 'Asking the AI…', 'Checking the answer…']

/** The visible "AI is working" state: three coins bounce while the status line moves through the pipeline steps. */
export function CoinLoader({ steps = STEPS, className = '' }: { steps?: string[]; className?: string }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 1500)
    return () => clearInterval(t)
  }, [steps.length])
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <span className="flex items-end gap-[3px] h-4" aria-hidden="true">
        {[0, 1, 2].map((n) => (
          <span key={n} className="coin-bounce w-3 h-3 rounded-full bg-[#F6C445] border border-[#D49A12] text-[7px] font-extrabold leading-none text-[#8A5A00] flex items-center justify-center" style={{ animationDelay: `${n * 0.15}s` }}>₹</span>
        ))}
      </span>
      <span>{steps[i]}</span>
    </span>
  )
}
