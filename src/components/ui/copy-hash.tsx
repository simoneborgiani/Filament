'use client'

import { useState } from 'react'

export function CopyHash({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 rounded border border-current px-2 py-1 text-xs opacity-60 transition-opacity hover:opacity-100"
    >
      {copied ? 'Copiato!' : 'Copia'}
    </button>
  )
}
