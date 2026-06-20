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
      <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
        {label}
      </dt>
      <dd className="mt-1 flex items-center">
        <span
          className="font-mono text-sm text-ink dark:text-snow"
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
      <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
        {label}
      </dt>
      <dd className="font-body mt-1 text-ink dark:text-snow">{value || '—'}</dd>
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
      <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
        {label}
      </dt>
      <dd className="font-body mt-1 text-ink dark:text-snow">
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
              className="font-body text-sm text-ink/60 underline underline-offset-4 hover:text-blue-brand dark:text-snow/60"
            >
              ← Torna alla dashboard
            </Link>
          </div>
        )}

        <h1 className="font-heading text-3xl font-bold tracking-tight text-ink dark:text-snow">
          Certificato di integrità
        </h1>

        <div className="mt-6">
          {signatureValid ? (
            <span className="inline-flex items-center rounded-sm border-2 border-green-900 bg-green-100 px-2 py-0.5 font-body text-xs font-medium text-green-900 dark:border-green-300 dark:bg-green-950 dark:text-green-300">
              ✓ Firma verificata
            </span>
          ) : (
            <span className="inline-flex items-center rounded-sm border-2 border-red-900 bg-red-100 px-2 py-0.5 font-body text-xs font-medium text-red-900 dark:border-red-300 dark:bg-red-950 dark:text-red-300">
              ✗ Firma non valida
            </span>
          )}
        </div>

        <dl className="mt-8 grid grid-cols-1 gap-6 rounded-sm border-2 border-ink bg-paper p-6 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark sm:grid-cols-2">
          <div>
            <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
              Nome file
            </dt>
            <dd className="font-body mt-1 break-words text-ink dark:text-snow">
              {doc.file_name}
            </dd>
          </div>

          <div>
            <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
              Dimensione
            </dt>
            <dd className="font-body mt-1 text-ink dark:text-snow">
              {formatFileSize(doc.file_size)}
            </dd>
          </div>

          <div>
            <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
              Data di caricamento
            </dt>
            <dd className="font-body mt-1 text-ink dark:text-snow">
              {formatDate(doc.created_at)}
            </dd>
          </div>

          <div>
            <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
              Certificato da
            </dt>
            <dd className="font-body mt-1 text-ink dark:text-snow">
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
            <dt className="font-body text-sm font-medium text-ink/60 dark:text-snow/60">
              Previous hash
            </dt>
            <dd className="mt-1">
              {doc.previous_hash === null ? (
                <span className="font-body text-ink/70 dark:text-snow/70">
                  Primo documento della catena (blocco genesi)
                </span>
              ) : previousDocId ? (
                <Link
                  href={`/certificato/${previousDocId}`}
                  className="font-mono text-sm text-ink underline underline-offset-4 hover:text-blue-brand dark:text-snow"
                  title={doc.previous_hash}
                >
                  {truncateHash(doc.previous_hash)}
                </Link>
              ) : (
                <span
                  className="font-mono text-sm text-ink dark:text-snow"
                  title={doc.previous_hash}
                >
                  {truncateHash(doc.previous_hash)}
                </span>
              )}
            </dd>
          </div>
        </dl>

        <section className="mt-8">
          <h2 className="font-heading text-xl font-bold text-ink dark:text-snow">
            Resoconto documento
          </h2>

          {doc.ai_summary ? (
            <dl className="mt-4 grid grid-cols-1 gap-6 rounded-sm border-2 border-ink bg-paper p-6 shadow-neo dark:border-edge dark:bg-surface dark:shadow-neo-dark sm:grid-cols-2">
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
            <p className="font-body mt-4 rounded-sm border-2 border-ink bg-paper px-4 py-6 text-center text-sm text-ink/70 dark:border-edge dark:bg-surface dark:text-snow/70">
              Resoconto in elaborazione… aggiorna la pagina tra qualche secondo.
            </p>
          )}

          <p className="font-body mt-3 rounded-sm border-2 border-amber-900 bg-amber-100 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-300 dark:bg-amber-950 dark:text-amber-300">
            ⚠️ Questo resoconto è generato automaticamente a scopo organizzativo.
            Non costituisce consulenza legale né perizia tecnica. Verificare sempre
            con un professionista qualificato.
          </p>
        </section>

        <p className="font-body mt-8 text-xs leading-relaxed text-ink/50 dark:text-snow/50">
          Questo certificato attesta l&apos;integrità crittografica del documento
          al momento del caricamento. Non costituisce validazione del contenuto né
          consulenza legale.
        </p>
      </div>
    </main>
  )
}
