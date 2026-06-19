'use server'

import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash, randomUUID } from 'node:crypto'
import { signData, decryptPrivateKey } from '@/lib/crypto'

export type UploadResult =
  | { ok: true; documentId: string }
  | { ok: false; error: string }

// Resoconto IA fattuale, NON bloccante. Estrae dati dal documento e li salva
// in documents.ai_summary via service role (l'unico UPDATE consentito sulla
// tabella append-only — vedi nota in handoff.md). Fallisce sempre in silenzio:
// è un bonus organizzativo, non deve mai influenzare l'upload.
async function generateAiSummary(
  documentId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
) {
  try {
    const base64 = fileBuffer.toString('base64')
    const dataUrl = `data:${mimeType};base64,${base64}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `Sei un assistente che estrae informazioni fattuali da documenti relativi a sinistri stradali e pratiche di infortunistica. Il tuo compito è SOLO descrivere quello che vedi nel documento — mai valutare, mai esprimere giudizi su responsabilità, congruità del danno, o validità legale. Rispondi SOLO in JSON valido, senza markdown, senza backtick, senza testo aggiuntivo.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
              {
                type: 'text',
                text: `Estrai le informazioni fattuali da questo documento (${fileName}) e restituisci un oggetto JSON con questa struttura esatta:
{
  "tipo_documento": "string",
  "data_documento": "string | null",
  "parti_coinvolte": ["string"],
  "importi": ["string"],
  "veicoli": ["string"],
  "luogo_sinistro": "string | null",
  "note_fattuali": ["string"]
}`,
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) return

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) return

    let summary: Record<string, unknown>
    try {
      summary = JSON.parse(text)
    } catch {
      return
    }

    const admin = createAdminClient()
    await admin
      .from('documents')
      .update({
        ai_summary: summary,
        ai_summary_at: new Date().toISOString(),
      })
      .eq('id', documentId)
  } catch {
    // Fail silently — il resoconto IA è un bonus, non blocca il flusso principale
  }
}

export async function uploadAction(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Non autenticato.' }

  const file = formData.get('file') as File | null
  const password = String(formData.get('password') ?? '')

  if (!file || file.size === 0)
    return { ok: false, error: 'Nessun file selezionato.' }
  if (!password)
    return { ok: false, error: 'Password richiesta per firmare il documento.' }

  // 1. Leggi il file e calcola SHA-256
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(arrayBuffer)
  const fileHash = createHash('sha256').update(fileBuffer).digest('hex')

  // 2. Recupera l'ultimo blocco della catena del cliente (previous_hash)
  const admin = createAdminClient()
  const { data: lastBlock } = await admin
    .from('documents')
    .select('block_hash')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previousHash = lastBlock?.block_hash ?? null

  // 3. Calcola block_hash = SHA-256(fileHash + previousHash + timestamp)
  const timestamp = new Date().toISOString()
  const blockContent = `${fileHash}|${previousHash ?? 'GENESIS'}|${timestamp}`
  const blockHash = createHash('sha256').update(blockContent).digest('hex')

  // 4. Decifra la chiave privata e firma il block_hash
  const { data: profile } = await admin
    .from('profiles')
    .select('encrypted_private_key')
    .eq('id', user.id)
    .single()

  if (!profile) return { ok: false, error: 'Profilo non trovato.' }

  let signature: string
  try {
    const privateKey = decryptPrivateKey(
      profile.encrypted_private_key,
      password,
      user.id
    )
    signature = await signData(blockHash, privateKey)
  } catch {
    return { ok: false, error: 'Password errata.' }
  }

  // 5. Upload file in Storage
  const storagePath = `${user.id}/${randomUUID()}-${file.name}`
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (storageError)
    return { ok: false, error: `Errore upload: ${storageError.message}` }

  // 6. Insert record in documents (append-only)
  const { data: doc, error: insertError } = await admin
    .from('documents')
    .insert({
      profile_id: user.id,
      file_name: file.name,
      file_size: file.size,
      file_hash: fileHash,
      previous_hash: previousHash,
      block_hash: blockHash,
      signature,
      storage_path: storagePath,
      ai_summary: null,
      ai_summary_at: null,
    })
    .select('id')
    .single()

  if (insertError) {
    // Cleanup: rimuovi il file dallo Storage se l'insert fallisce
    await supabase.storage.from('documents').remove([storagePath])
    return { ok: false, error: `Errore salvataggio: ${insertError.message}` }
  }

  // Resoconto IA in background: after() lo esegue DOPO che la risposta è stata
  // inviata, mantenendo viva la funzione anche su Vercel (a differenza di un
  // fire-and-forget che verrebbe terminato alla fine della request).
  const docId = doc.id
  after(() => generateAiSummary(docId, fileBuffer, file.name, file.type))

  return { ok: true, documentId: doc.id }
}
