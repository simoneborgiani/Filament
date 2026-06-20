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
      className="ml-2 rounded-sm border-2 border-ink bg-paper px-2 py-0.5 font-body text-xs font-medium text-ink transition-colors duration-100 hover:border-blue-brand hover:text-blue-brand dark:border-edge dark:bg-void dark:text-snow dark:hover:border-blue-brand dark:hover:text-blue-brand"
    >
      {copied ? 'Copiato!' : 'Copia'}
    </button>
  )
}
