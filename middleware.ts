import { createClient } from '@/utils/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function middleware(request: NextRequest) {
  // Always refresh the session via the middleware client
  const supabaseResponse = await createClient(request)

  // Check if this is a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/api/protected')

  if (isProtectedRoute) {
    // Try to get the current user using server client
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If no user, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}