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
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Benvenuto,</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {profile?.studio_name ?? 'il tuo studio'}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Impostazioni
            </Link>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Carica nuovo documento
            </Link>
          </div>
        </div>

        {total === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
            <p className="text-zinc-600 dark:text-zinc-400">
              Nessun documento certificato ancora.
            </p>
            <Link
              href="/dashboard/upload"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Carica il primo documento
            </Link>
          </div>
        ) : (
          <>
            <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Documenti totali
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {total}
                </dd>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Primo documento
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {firstUpload ? formatDate(firstUpload) : '—'}
                </dd>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                  Ultimo documento
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {lastUpload ? formatDate(lastUpload) : '—'}
                </dd>
              </div>
            </dl>

            <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
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
                <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                  {docs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="max-w-xs truncate px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {doc.file_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                          ✓ Firmato
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          href={`/certificato/${doc.id}`}
                          className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
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
