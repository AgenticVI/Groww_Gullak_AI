import { useState } from 'react'
import { PigHead } from '../ai/PigHead'
import type { ReactNode } from 'react'
import { ArrowLeft, ChevronRight } from './icons'
import { C } from '../tree/shapes'

export function BackBar({ title, sub, onBack, right }: { title: ReactNode; sub?: ReactNode; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="bar flex items-center gap-2 px-4 pt-4 pb-3 bg-white border-b border-line/0">
      <button onClick={onBack} aria-label="Back" className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full text-ink">
        <ArrowLeft size={22} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-[17px] font-bold text-ink leading-tight flex items-center gap-1.5">{title}</div>
        {sub && <div className="text-[12.5px] font-medium text-mute mt-0.5">{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export function Logo({ size = 40 }: { size?: number }) {
  // Optional: drop your own company logo at public/brand/logo.png and it shows here.
  // If the file is missing, the original Gullak mark below is used.
  const [custom, setCustom] = useState(true)
  if (custom) return <img src="/brand/logo.png" alt="Logo" style={{ height: size, maxWidth: 140 }} className="object-contain w-auto" onError={() => setCustom(false)} />
  // Original Gullak mark: a coin on a teal-to-indigo tile
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Goal Gullak">
      <defs><linearGradient id="gg-logo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#00B386" /><stop offset="1" stopColor="#3B4FD8" /></linearGradient></defs>
      <rect width="40" height="40" rx="11" fill="url(#gg-logo)" />
      <circle cx="20" cy="20" r="11" fill="#fff" />
      <circle cx="20" cy="20" r="8.2" fill="none" stroke="#F6C445" strokeWidth="1.6" />
      <text x="20" y="20.6" textAnchor="middle" dominantBaseline="central" fontSize="11.5" fontWeight="800" fill="#8A5A00" fontFamily="Inter, system-ui, sans-serif">₹</text>
    </svg>
  )
}

export function FundTile({ size = 40 }: { size?: number }) {
  return (
    <span style={{ width: size, height: size }} className="rounded-xl bg-[#FDECE4] text-[#C2410C] font-extrabold flex items-center justify-center flex-shrink-0 text-[13px]" aria-hidden="true">
      IP
    </span>
  )
}

export function LeafIcon({ size = 20, color = C.leaf, vein = C.vein }: { size?: number; color?: string; vein?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <path d="M4 21 C6 11 13 5 23 4 C22 14 15 20 4 21 Z" fill={color} />
      <path d="M5 20 Q13 13 22 5" stroke={vein} strokeWidth="1.2" fill="none" />
    </svg>
  )
}

export function BanyanLinkCard({ onClick, icon, title, sub }: { onClick: () => void; icon: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-card border border-line bg-white px-3 py-2.5 min-h-[56px] text-left">
      {icon}
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold text-ink">{title}</span>
        {sub && <span className="block text-[12px] text-mute">{sub}</span>}
      </span>
      <ChevronRight size={18} color="#6B6E7E" />
    </button>
  )
}

export function Pill({ children, tone = 'green' }: { children: ReactNode; tone?: 'green' | 'amber' | 'grey' | 'dashed' | 'red' }) {
  const cls = {
    green: 'bg-tint text-[#007A57]',
    amber: 'bg-[#FFF3DC] text-[#8A5A00]',
    grey: 'bg-[#F0F2F5] text-mute',
    dashed: 'bg-white text-[#007A57] border border-dashed border-brand',
    red: 'bg-[#FCEDE2] text-[#B4531A]',
  }[tone]
  return <span className={`px-2.5 py-1 rounded-[10px] text-[12px] font-bold ${cls}`}>{children}</span>
}

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="dsk-c absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={label}>
      <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative bg-white rounded-t-[20px] dsk-p max-h-[92%] overflow-y-auto px-4 pt-3 pb-5 shadow-2xl">
        <div className="mx-auto mb-3 w-10 h-1 rounded-full bg-line" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
