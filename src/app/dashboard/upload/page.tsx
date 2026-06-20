'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { uploadAction } from './actions'
import { formatFileSize } from '@/lib/format'

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFiles(files: FileList | null) {
    setSelectedFile(files && files.length > 0 ? files[0] : null)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0 && fileInputRef.current) {
      // Sincronizza il file droppato con l'input nascosto così entra nella FormData.
      fileInputRef.current.files = droppedFiles
      handleFiles(droppedFiles)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await uploadAction(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/certificato/${result.documentId}`)
    })
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="font-body text-sm text-ink/60 underline underline-offset-4 hover:text-blue-brand dark:text-snow/60"
          >
            ← Torna alla dashboard
          </Link>
        </div>

        <h1 className="font-heading text-3xl font-bold tracking-tight text-ink dark:text-snow">
          Carica e certifica
        </h1>
        <p className="font-body mt-2 text-sm text-ink/70 dark:text-snow/70">
          Il documento viene hashato (SHA-256), firmato con la tua chiave privata
          e aggiunto alla tua hash-chain.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium text-ink dark:text-snow">
              Documento
            </span>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              className={`cursor-pointer rounded-sm border-2 border-dashed px-4 py-8 text-center transition-colors duration-100 ${
                isDragging
                  ? 'border-blue-brand bg-paper dark:bg-surface'
                  : 'border-ink hover:border-blue-brand dark:border-edge'
              }`}
            >
              {selectedFile ? (
                <div>
                  <p className="font-body truncate font-medium text-ink dark:text-snow">
                    {selectedFile.name}
                  </p>
                  <p className="font-body mt-1 text-sm text-ink/60 dark:text-snow/60">
                    {formatFileSize(selectedFile.size)} · clicca o trascina per
                    cambiare
                  </p>
                </div>
              ) : (
                <p className="font-body text-sm text-ink/60 dark:text-snow/60">
                  Trascina qui il file, oppure clicca per selezionarlo
                </p>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="file"
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              required
              className="sr-only"
              onChange={(e) => handleFiles(e.currentTarget.files)}
            />
            <p className="font-body text-xs text-ink/50 dark:text-snow/50">
              PDF, JPG, PNG o WebP. Max 50MB.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-body text-sm font-medium text-ink dark:text-snow"
            >
              Password account — serve per firmare il documento
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

          {isPending && (
            <p
              role="status"
              className="rounded-sm border-2 border-ink bg-paper px-3 py-2 font-body text-sm text-ink dark:border-edge dark:bg-surface dark:text-snow"
            >
              Caricamento in corso… questo può richiedere qualche secondo per file
              grandi.
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !selectedFile}
            className="neo-btn mt-2 inline-flex items-center justify-center rounded-sm border-2 border-ink bg-blue-brand px-5 py-2.5 font-body font-medium text-snow disabled:cursor-not-allowed disabled:opacity-60 dark:border-edge"
          >
            {isPending ? 'Caricamento e firma…' : 'Carica e certifica'}
          </button>
        </form>
      </div>
    </main>
  )
}
