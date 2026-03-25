import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes logic
  const isAuthPage = request.nextUrl.pathname === '/'
  const isProtectedRoute = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/rooms') || 
    request.nextUrl.pathname.startsWith('/notes') ||
    request.nextUrl.pathname.startsWith('/settings')

  if (user && isAuthPage) {
    // If user is logged in and tries to access landing page, redirect to dashboard
    // We need to check the role to redirect to the correct dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    const redirectUrl = profile?.role === 'teacher' ? '/dashboard-teacher' : profile?.role === 'admin' ? '/dashboard-admin' : profile?.role === 'staff' ? '/dashboard-staff' : '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  if (!user && isProtectedRoute) {
    // If user is not logged in and tries to access protected route, redirect to home
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}
