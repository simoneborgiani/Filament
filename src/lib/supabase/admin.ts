import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase con SERVICE ROLE — bypassa la RLS.
 *
 * SOLO server-side. La service role key NON deve mai raggiungere il browser:
 * non usa il prefisso NEXT_PUBLIC_ e questo modulo va importato esclusivamente
 * da Server Action / route handler / codice server.
 *
 * Serve in fase di signup: con email-confirmation attiva non c'è ancora una
 * sessione, quindi un insert in `profiles` con il client authenticated fallirebbe
 * la policy RLS (auth.uid() = id). Il service role permette di creare il profilo
 * (con chiave pubblica + chiave privata cifrata) in modo atomico alla registrazione.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
