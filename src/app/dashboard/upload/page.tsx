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
            className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Torna alla dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Carica e certifica
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Il documento viene hashato (SHA-256), firmato con la tua chiave privata
          e aggiunto alla tua hash-chain.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
              className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                isDragging
                  ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-300 dark:bg-zinc-800'
                  : 'border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
            >
              {selectedFile ? (
                <div>
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {formatFileSize(selectedFile.size)} · clicca o trascina per
                    cambiare
                  </p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              PDF, JPG, PNG o WebP. Max 50MB.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password account — serve per firmare il documento
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </p>
          )}

          {isPending && (
            <p
              role="status"
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Caricamento in corso… questo può richiedere qualche secondo per file
              grandi.
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !selectedFile}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isPending ? 'Caricamento e firma…' : 'Carica e certifica'}
          </button>
        </form>
      </div>
    </main>
  )
}
