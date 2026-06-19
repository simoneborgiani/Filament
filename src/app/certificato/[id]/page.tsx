import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifySignature } from '@/lib/crypto'
import { formatFileSize, formatDate, truncateHash } from '@/lib/format'
import { CopyHash } from '@/components/ui/copy-hash'

// Pagina PUBBLICA: nessuna auth, nessun getUser, nessun redirect.
// Vengono selezionati SOLO i campi pubblici: mai storage_path o chiavi private.

type AiSummary = {
  tipo_documento?: string | null
  data_documento?: string | null
  parti_coinvolte?: string[]
  importi?: string[]
  veicoli?: string[]
  luogo_sinistro?: string | null
  note_fattuali?: string[]
}

type CertificateDoc = {
  id: string
  file_name: string
  file_size: number
  file_hash: string
  previous_hash: string | null
  block_hash: string
  signature: string
  created_at: string
  profile_id: string
  ai_summary: AiSummary | null
  ai_summary_at: string | null
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 flex items-center">
        <span
          className="font-mono text-sm text-zinc-900 dark:text-zinc-100"
          title={value}
        >
          {truncateHash(value)}
        </span>
        <CopyHash value={value} />
      </dd>
    </div>
  )
}

function SummaryText({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{value || '—'}</dd>
    </div>
  )
}

function SummaryList({
  label,
  values,
}: {
  label: string
  values: string[] | undefined
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
        {values && values.length > 0 ? (
          <ul className="list-inside list-disc space-y-0.5">
            {values.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        ) : (
          '—'
        )}
      </dd>
    </div>
  )
}

export default async function CertificatoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const admin = createAdminClient()

  const { data: doc } = await admin
    .from('documents')
    .select(
      'id, file_name, file_size, file_hash, previous_hash, block_hash, signature, created_at, profile_id, ai_summary, ai_summary_at'
    )
    .eq('id', id)
    .maybeSingle<CertificateDoc>()

  if (!doc) {
    notFound()
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('public_key, studio_name')
    .eq('id', doc.profile_id)
    .maybeSingle<{ public_key: string; studio_name: string }>()

  // Verifica della firma digitale sul block_hash con la chiave pubblica del cliente.
  let signatureValid = false
  if (profile) {
    try {
      signatureValid = await verifySignature(
        doc.block_hash,
        doc.signature,
        profile.public_key
      )
    } catch {
      signatureValid = false
    }
  }

  // previous_hash è il block_hash del documento precedente, non il suo id:
  // risaliamo all'id per costruire il link al certificato precedente.
  let previousDocId: string | null = null
  if (doc.previous_hash) {
    const { data: prev } = await admin
      .from('documents')
      .select('id')
      .eq('block_hash', doc.previous_hash)
      .maybeSingle<{ id: string }>()
    previousDocId = prev?.id ?? null
  }

  // Pagina pubblica: nessun redirect. getUser() serve solo a mostrare il link
  // di ritorno alla dashboard se chi visita è autenticato.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        {user && (
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← Torna alla dashboard
            </Link>
          </div>
        )}

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Certificato di integrità
        </h1>

        <div className="mt-6">
          {signatureValid ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
              ✓ Firma verificata
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
              ✗ Firma non valida
            </span>
          )}
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Nome file
            </dt>
            <dd className="mt-1 break-words text-zinc-900 dark:text-zinc-100">
              {doc.file_name}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Dimensione
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {formatFileSize(doc.file_size)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Data di caricamento
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {formatDate(doc.created_at)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Certificato da
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {profile?.studio_name ?? '—'}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <HashRow label="Hash del file (SHA-256)" value={doc.file_hash} />
          </div>

          <div className="sm:col-span-2">
            <HashRow label="Block hash" value={doc.block_hash} />
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Previous hash
            </dt>
            <dd className="mt-1">
              {doc.previous_hash === null ? (
                <span className="text-zinc-600 dark:text-zinc-400">
                  Primo documento della catena (blocco genesi)
                </span>
              ) : previousDocId ? (
                <Link
                  href={`/certificato/${previousDocId}`}
                  className="font-mono text-sm text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
                  title={doc.previous_hash}
                >
                  {truncateHash(doc.previous_hash)}
                </Link>
              ) : (
                <span
                  className="font-mono text-sm text-zinc-900 dark:text-zinc-100"
                  title={doc.previous_hash}
                >
                  {truncateHash(doc.previous_hash)}
                </span>
              )}
            </dd>
          </div>
        </dl>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Resoconto documento
          </h2>

          {doc.ai_summary ? (
            <dl className="mt-4 grid grid-cols-1 gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2">
              <SummaryText
                label="Tipo documento"
                value={doc.ai_summary.tipo_documento}
              />
              <SummaryText
                label="Data documento"
                value={doc.ai_summary.data_documento}
              />
              <SummaryText
                label="Luogo sinistro"
                value={doc.ai_summary.luogo_sinistro}
              />
              <SummaryList
                label="Parti coinvolte"
                values={doc.ai_summary.parti_coinvolte}
              />
              <SummaryList label="Importi" values={doc.ai_summary.importi} />
              <SummaryList label="Veicoli" values={doc.ai_summary.veicoli} />
              <div className="sm:col-span-2">
                <SummaryList
                  label="Note fattuali"
                  values={doc.ai_summary.note_fattuali}
                />
              </div>
            </dl>
          ) : (
            <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Resoconto in elaborazione… aggiorna la pagina tra qualche secondo.
            </p>
          )}

          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            ⚠️ Questo resoconto è generato automaticamente a scopo organizzativo.
            Non costituisce consulenza legale né perizia tecnica. Verificare sempre
            con un professionista qualificato.
          </p>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
          Questo certificato attesta l&apos;integrità crittografica del documento
          al momento del caricamento. Non costituisce validazione del contenuto né
          consulenza legale.
        </p>
      </div>
    </main>
  )
}
