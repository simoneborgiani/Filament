'use client'

import { useState } from 'react'

export function ThemeToggle() {
  // Lazy init: sul server document non esiste → null (placeholder).
  // Sul client legge la classe .dark applicata dallo script inline prima del paint.
  // L'icona ha suppressHydrationWarning, quindi l'eventuale mismatch è innocuo.
  const [isDark, setIsDark] = useState<boolean | null>(() =>
    typeof document === 'undefined'
      ? null
      : document.documentElement.classList.contains('dark')
  )

  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // localStorage non disponibile: il tema resta valido per la sessione corrente.
    }
    setIsDark(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      title={isDark ? 'Tema chiaro' : 'Tema scuro'}
      className="neo-btn fixed right-4 bottom-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-sm border-2 border-ink bg-paper text-base text-ink dark:border-edge dark:bg-surface dark:text-snow"
    >
      {/* Mostra l'icona della modalità verso cui si passa */}
      <span aria-hidden suppressHydrationWarning>
        {isDark === null ? '◐' : isDark ? '☀' : '☾'}
      </span>
    </button>
  )
}
