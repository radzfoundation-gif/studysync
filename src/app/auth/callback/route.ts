import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const requestedRole = searchParams.get('role');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {}
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.delete({ name, ...options });
            } catch (error) {}
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      let finalRedirect = next;
      const requestedRole = searchParams.get('role');
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        let userRole = 'student';
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

        // Priority: requestedRole (from URL) > profile.role (from DB)
        if (requestedRole) {
          // If a role was explicitly requested (e.g., via "Mulai Sebagai Guru"), use it
          await supabase.from('profiles').upsert({ 
            id: user.id, 
            role: requestedRole,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User'
          });
          await supabase.auth.updateUser({ data: { role: requestedRole } });
          userRole = requestedRole;
        } else if (profile?.role && profile.role !== 'student') {
          // If user already has a confirmed role (e.g., teacher), use it
          userRole = profile.role;
        } else {
          // NEW USER or DEFAULT 'student' with no explicit request: 
          // Always send to Role Selection for "Better Validity"
          return NextResponse.redirect(new URL('/auth/role-selection', request.url));
        }

        // Force correct dashboard based on determined role
        if (userRole === 'teacher') {
          finalRedirect = '/dashboard-teacher';
        } else {
          finalRedirect = '/dashboard';
        }
      }

      return NextResponse.redirect(new URL(finalRedirect, request.url));
    } else {
      console.error("Auth callback error:", error.message);
    }
  }

  // Fallback to landing page if something goes wrong
  return NextResponse.redirect(`${origin}/`);
}
