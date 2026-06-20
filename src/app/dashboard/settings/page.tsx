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
            className="font-body text-sm text-ink/60 underline underline-offset-4 hover:text-blue-brand dark:text-snow/60"
          >
            ← Torna alla dashboard
          </Link>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight text-ink dark:text-snow">
          Impostazioni
        </h1>

        <section className="mt-8 rounded-sm border-2 border-ink bg-paper p-6 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark">
          <h2 className="font-heading text-lg font-bold text-ink dark:text-snow">
            Account
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
                Nome studio
              </dt>
              <dd className="font-body mt-1 text-ink dark:text-snow">
                {profile?.studio_name ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
                Email
              </dt>
              <dd className="font-body mt-1 break-words text-ink dark:text-snow">
                {profile?.email ?? user?.email ?? '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-6 rounded-sm border-2 border-ink bg-paper p-6 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark">
          <h2 className="font-heading text-lg font-bold text-ink dark:text-snow">
            Chiavi crittografiche
          </h2>
          <p className="font-body mt-1 text-sm text-ink/60 dark:text-snow/60">
            La chiave pubblica verifica le firme dei tuoi certificati. La chiave
            privata è cifrata e non è mai mostrata.
          </p>
          <div className="mt-4">
            <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
              Chiave pubblica
            </dt>
            <dd className="mt-1 flex items-center">
              {profile?.public_key ? (
                <>
                  <span
                    className="font-mono text-sm text-ink dark:text-snow"
                    title={profile.public_key}
                  >
                    {truncateHash(profile.public_key)}
                  </span>
                  <CopyHash value={profile.public_key} />
                </>
              ) : (
                <span className="font-body text-ink/70 dark:text-snow/70">—</span>
              )}
            </dd>
          </div>
        </section>

        <section className="mt-6 rounded-sm border-2 border-ink bg-paper p-6 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark">
          <h2 className="font-heading text-lg font-bold text-ink dark:text-snow">
            Sessione
          </h2>
          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="neo-btn inline-flex items-center justify-center rounded-sm border-2 border-ink bg-paper px-5 py-2.5 font-body font-medium text-ink dark:border-edge dark:bg-void dark:text-snow"
            >
              Esci
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
