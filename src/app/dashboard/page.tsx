import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatFileSize, formatDate } from '@/lib/format'

type DocumentRow = {
  id: string
  file_name: string
  file_size: number
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Il layout garantisce l'autenticazione; user! è sicuro qui.
  const { data: profile } = await supabase
    .from('profiles')
    .select('studio_name')
    .eq('id', user!.id)
    .maybeSingle<{ studio_name: string }>()

  // La policy public SELECT su documents è permissiva: il filtro per profile_id
  // è necessario per mostrare solo i documenti del cliente loggato.
  const { data: documents } = await supabase
    .from('documents')
    .select('id, file_name, file_size, created_at')
    .eq('profile_id', user!.id)
    .order('created_at', { ascending: false })
    .returns<DocumentRow[]>()

  const docs = documents ?? []
  const total = docs.length
  // docs è ordinato desc: il primo elemento è il più recente, l'ultimo il primo caricato.
  const lastUpload = docs[0]?.created_at ?? null
  const firstUpload = docs[total - 1]?.created_at ?? null

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-sm text-ink/60 dark:text-snow/60">
              Benvenuto,
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-ink dark:text-snow">
              {profile?.studio_name ?? 'il tuo studio'}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="font-body text-sm font-medium text-ink underline underline-offset-4 hover:text-blue-brand dark:text-snow"
            >
              Impostazioni
            </Link>
            <Link
              href="/dashboard/upload"
              className="neo-btn inline-flex items-center justify-center rounded-sm border-2 border-ink bg-blue-brand px-5 py-2.5 font-body font-medium text-snow dark:border-edge"
            >
              Carica nuovo documento
            </Link>
          </div>
        </div>

        {total === 0 ? (
          <div className="mt-12 rounded-sm border-2 border-dashed border-ink px-6 py-16 text-center dark:border-edge">
            <p className="font-body text-ink/70 dark:text-snow/70">
              Nessun documento certificato ancora.
            </p>
            <Link
              href="/dashboard/upload"
              className="neo-btn mt-4 inline-flex items-center justify-center rounded-sm border-2 border-ink bg-blue-brand px-5 py-2.5 font-body font-medium text-snow dark:border-edge"
            >
              Carica il primo documento
            </Link>
          </div>
        ) : (
          <>
            <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-sm border-2 border-ink bg-paper p-5 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark">
                <dt className="font-body text-sm text-ink/60 dark:text-snow/60">
                  Documenti totali
                </dt>
                <dd className="font-heading mt-1 text-2xl font-bold text-ink dark:text-snow">
                  {total}
                </dd>
              </div>
              <div className="rounded-sm border-2 border-ink bg-paper p-5 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark">
                <dt className="font-body text-sm text-ink/60 dark:text-snow/60">
                  Primo documento
                </dt>
                <dd className="font-body mt-1 text-sm font-medium text-ink dark:text-snow">
                  {firstUpload ? formatDate(firstUpload) : '—'}
                </dd>
              </div>
              <div className="rounded-sm border-2 border-ink bg-paper p-5 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark">
                <dt className="font-body text-sm text-ink/60 dark:text-snow/60">
                  Ultimo documento
                </dt>
                <dd className="font-body mt-1 text-sm font-medium text-ink dark:text-snow">
                  {lastUpload ? formatDate(lastUpload) : '—'}
                </dd>
              </div>
            </dl>

            <div className="mt-8 overflow-hidden rounded-sm border-2 border-ink dark:border-edge">
              <table className="w-full text-left font-body text-sm">
                <thead className="border-b-2 border-ink bg-paper text-ink/60 dark:border-edge dark:bg-surface dark:text-snow/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nome file</th>
                    <th className="px-4 py-3 font-medium">Dimensione</th>
                    <th className="px-4 py-3 font-medium">Caricato il</th>
                    <th className="px-4 py-3 font-medium">Stato</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">Azioni</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-ink bg-paper dark:divide-edge dark:bg-void">
                  {docs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="max-w-xs truncate px-4 py-3 font-medium text-ink dark:text-snow">
                        {doc.file_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink/70 dark:text-snow/70">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink/70 dark:text-snow/70">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-sm border-2 border-green-900 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-900 dark:border-green-300 dark:bg-green-950 dark:text-green-300">
                          ✓ Firmato
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          href={`/certificato/${doc.id}`}
                          className="font-medium text-ink underline underline-offset-4 hover:text-blue-brand dark:text-snow"
                        >
                          Certificato
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
