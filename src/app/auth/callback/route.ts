import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const requestedRole = searchParams.get('role');

  if (code) {
    // Initial redirect to 'next' as fallback, but we will likely override this
    const response = NextResponse.redirect(new URL(next, request.url));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          async remove(name: string, options: CookieOptions) {
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
          await supabase.from('profiles').upsert({ 
            id: user.id, 
            role: requestedRole,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User'
          });
          await supabase.auth.updateUser({ data: { role: requestedRole } });
          userRole = requestedRole;
        } else if (profile?.role) {
          userRole = profile.role;
        } else {
          // If no role, go to selection screen
          const selectionResponse = NextResponse.redirect(new URL('/auth/role-selection', request.url));
          // Important: Copy cookies to the new response
          response.cookies.getAll().forEach(cookie => {
            selectionResponse.cookies.set(cookie);
          });
          return selectionResponse;
        }

        const finalUrl = userRole === 'teacher' ? '/dashboard-teacher' : '/dashboard';
        const finalResponse = NextResponse.redirect(new URL(finalUrl, request.url));
        
        // Ensure all auth cookies are transferred to the final redirect
        response.cookies.getAll().forEach(cookie => {
          finalResponse.cookies.set(cookie);
        });
        
        return finalResponse;
      }
    } else {
      console.error("Auth callback exchange error:", error.message);
      return NextResponse.redirect(`${origin}/?error=auth_failed&message=${encodeURIComponent(error.message)}`);
    }
  }

  // Fallback if no code or other failure
  const errorMsg = searchParams.get('error_description') || 'No code provided';
  return NextResponse.redirect(`${origin}/?error=auth_failed&message=${encodeURIComponent(errorMsg)}`);
}
