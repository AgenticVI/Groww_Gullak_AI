/** Indian-style formatting helpers shared by client, server and templates. */
export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
export const inrDec = (n: number, d = 2) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })
export const pctSigned = (n: number, d = 1) => (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(d) + '%'
export const pctAbs = (n: number, d = 1) => Math.abs(n).toFixed(d) + '%'
export const unitsFmt = (n: number) => n.toFixed(3)
export const round1 = (n: number) => Math.round(n * 10) / 10

/** Compact Indian format for tight tiles: ₹29K, ₹1.4L, ₹2.1Cr. */
export function inrShort(n: number): string {
  const a = Math.abs(n)
  const f = (v: number, u: string) => `₹${(Math.round(v * 10) / 10).toString().replace(/\.0$/, '')}${u}`
  if (a >= 1e7) return f(n / 1e7, 'Cr')
  if (a >= 1e5) return f(n / 1e5, 'L')
  if (a >= 1e3) return f(n / 1e3, 'K')
  return `₹${Math.round(n)}`
}
