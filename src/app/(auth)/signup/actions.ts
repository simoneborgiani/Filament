'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateKeyPair, encryptPrivateKey } from '@/lib/crypto'

export type SignupResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string }

export async function signupAction(formData: FormData): Promise<SignupResult> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const studioName = String(formData.get('studio_name') ?? '').trim()

  if (!email || !password || !studioName) {
    return { ok: false, error: 'Compila tutti i campi.' }
  }
  if (password.length < 8) {
    return { ok: false, error: 'La password deve avere almeno 8 caratteri.' }
  }

  const supabase = await createClient()

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    return { ok: false, error: signUpError.message }
  }

  const user = signUpData.user
  if (!user) {
    return { ok: false, error: 'Registrazione non riuscita. Riprova.' }
  }

  // Genera la coppia di chiavi ed25519 e cifra la privata con
  // PBKDF2(password, user.id) → AES-256-GCM.
  const { publicKey, privateKey } = await generateKeyPair()
  const encryptedPrivateKey = encryptPrivateKey(privateKey, password, user.id)

  // Insert via service role: con email-confirmation attiva non c'è sessione,
  // quindi la policy RLS "insert own" bloccherebbe l'authenticated client.
  const admin = createAdminClient()
  const { error: profileError } = await admin.from('profiles').insert({
    id: user.id,
    studio_name: studioName,
    email,
    public_key: publicKey,
    encrypted_private_key: encryptedPrivateKey,
  })

  if (profileError) {
    return {
      ok: false,
      error: `Account creato ma profilo non salvato: ${profileError.message}`,
    }
  }

  // Se la sessione esiste già (email-confirmation disattivata) non serve conferma.
  const needsEmailConfirmation = signUpData.session === null

  return { ok: true, needsEmailConfirmation }
}
