/** The Gullak's face: used as the chatbot's avatar and on the Ask Gullak buttons. */
export function PigHead({ size = 28, sparkle = false }: { size?: number; sparkle?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 13 L7 3.5 L14 8.5Z" fill="#F3B9A3" stroke="#E0A68C" strokeWidth="1" strokeLinejoin="round" />
      <path d="M26 13 L25 3.5 L18 8.5Z" fill="#F3B9A3" stroke="#E0A68C" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="16" cy="17.5" r="12.5" fill="#FFE3D6" stroke="#E0A68C" strokeWidth="1.4" />
      <circle cx="10" cy="20" r="2.4" fill="#FFB8A8" opacity=".7" />
      <circle cx="22" cy="20" r="2.4" fill="#FFB8A8" opacity=".7" />
      <circle cx="11.5" cy="14.5" r="1.5" fill="#44475B" />
      <circle cx="20.5" cy="14.5" r="1.5" fill="#44475B" />
      <ellipse cx="16" cy="21" rx="5.2" ry="3.7" fill="#F3B9A3" stroke="#E0A68C" strokeWidth="1" />
      <ellipse cx="14.2" cy="21" rx="0.9" ry="1.3" fill="#B07A62" />
      <ellipse cx="17.8" cy="21" rx="0.9" ry="1.3" fill="#B07A62" />
      <path d="M13 6.5 Q16 4.8 19 6.5" stroke="#B07A62" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {sparkle && <path d="M28 1 L29.1 4 L32 5.1 L29.1 6.2 L28 9.2 L26.9 6.2 L24 5.1 L26.9 4Z" fill="#00B386" />}
    </svg>
  )
}
