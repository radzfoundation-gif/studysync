import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const requestedRole = searchParams.get('role');

  if (code) {
    // Create an initial response object to attach cookies to
    const response = NextResponse.redirect(new URL(next, request.url));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().then(store => store.get(name)?.value);
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        let userRole = 'student';
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

        if (requestedRole) {
          // Priority 1: User explicitly asked for a role (e.g. Mulai Sebagai Guru)
          await supabase.from('profiles').upsert({ 
            id: user.id, 
            role: requestedRole,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User'
          });
          await supabase.auth.updateUser({ data: { role: requestedRole } });
          userRole = requestedRole;
        } else if (profile?.role) {
          // Priority 2: Use existing role from DB
          userRole = profile.role;
        } else {
          // New user with no requested role -> Role Selection
          return NextResponse.redirect(new URL('/auth/role-selection', request.url));
        }

        const finalUrl = userRole === 'teacher' ? '/dashboard-teacher' : '/dashboard';
        return NextResponse.redirect(new URL(finalUrl, request.url));
      }
      
      // If user but no logic matched, just send to response we initialized
      return response;
    } else {
      console.error("Auth callback exchange error:", error.message);
    }
  }

  // Fallback to landing page if something goes wrong
  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
