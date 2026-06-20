'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    startTransition(async () => {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Email o password non corretti.')
        return
      }

      // Refresh per far rileggere ai Server Component il cookie di sessione,
      // poi vai alla dashboard.
      router.refresh()
      router.push('/dashboard')
    })
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-ink dark:text-snow">
          Accedi
        </h1>
        <p className="font-body mt-2 text-sm text-ink/70 dark:text-snow/70">
          Entra nel tuo account Filament.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="font-body text-sm font-medium text-ink dark:text-snow"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-sm border-2 border-ink bg-paper px-4 py-2.5 font-body text-ink placeholder:text-ink/40 focus:border-blue-brand focus:outline-none dark:border-edge dark:bg-void dark:text-snow dark:placeholder:text-snow/40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-body text-sm font-medium text-ink dark:text-snow"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-sm border-2 border-ink bg-paper px-4 py-2.5 font-body text-ink placeholder:text-ink/40 focus:border-blue-brand focus:outline-none dark:border-edge dark:bg-void dark:text-snow dark:placeholder:text-snow/40"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-sm border-2 border-red-900 bg-red-100 px-3 py-2 font-body text-sm font-medium text-red-900 dark:border-red-300 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="neo-btn mt-2 inline-flex items-center justify-center rounded-sm border-2 border-ink bg-blue-brand px-5 py-2.5 font-body font-medium text-snow disabled:cursor-not-allowed disabled:opacity-60 dark:border-edge"
          >
            {isPending ? 'Accesso…' : 'Accedi'}
          </button>
        </form>

        <p className="font-body mt-6 text-center text-sm text-ink/70 dark:text-snow/70">
          Non hai un account?{' '}
          <Link
            href="/signup"
            className="font-medium text-ink underline underline-offset-4 hover:text-blue-brand dark:text-snow"
          >
            Registrati
          </Link>
        </p>
      </div>
    </main>
  )
}
