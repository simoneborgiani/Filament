import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 ha rinominato la convenzione `middleware` in `proxy`.
// La logica (refresh sessione + protezione /dashboard) vive in updateSession.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
