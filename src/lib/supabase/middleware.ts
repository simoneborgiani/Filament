import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIX = '/dashboard'

export async function updateSession(request: NextRequest) {
  const isProtected = request.nextUrl.pathname.startsWith(PROTECTED_PREFIX)
  let supabaseResponse = NextResponse.next({ request })

  // Se Supabase non è configurato (es. .env.local con placeholder), creare il
  // client lancia "Invalid supabaseUrl". In quel caso falliamo in sicurezza:
  // niente sessione, e le route protette vengono rimandate al login.
  let supabase
  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
  } catch {
    return isProtected
      ? NextResponse.redirect(new URL('/login', request.url))
      : supabaseResponse
  }

  // IMPORTANT: getUser() server-side — mai fidarsi del client per l'auth.
  // Qualsiasi errore (rete, credenziali) viene trattato come "non autenticato".
  let user = null
  try {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser()
    user = fetchedUser
  } catch {
    user = null
  }

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}
