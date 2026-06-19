import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { truncateHash } from '@/lib/format'
import { CopyHash } from '@/components/ui/copy-hash'

async function signOutAction() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Il layout garantisce l'autenticazione; user! è sicuro qui.
  const { data: profile } = await supabase
    .from('profiles')
    .select('studio_name, email, public_key')
    .eq('id', user!.id)
    .maybeSingle<{ studio_name: string; email: string; public_key: string }>()

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Torna alla dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Impostazioni
        </h1>

        <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Account
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Nome studio
              </dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                {profile?.studio_name ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Email
              </dt>
              <dd className="mt-1 break-words text-zinc-900 dark:text-zinc-100">
                {profile?.email ?? user?.email ?? '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Chiavi crittografiche
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            La chiave pubblica verifica le firme dei tuoi certificati. La chiave
            privata è cifrata e non è mai mostrata.
          </p>
          <div className="mt-4">
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Chiave pubblica
            </dt>
            <dd className="mt-1 flex items-center">
              {profile?.public_key ? (
                <>
                  <span
                    className="font-mono text-sm text-zinc-900 dark:text-zinc-100"
                    title={profile.public_key}
                  >
                    {truncateHash(profile.public_key)}
                  </span>
                  <CopyHash value={profile.public_key} />
                </>
              ) : (
                <span className="text-zinc-600 dark:text-zinc-400">—</span>
              )}
            </dd>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Sessione
          </h2>
          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Esci
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
