import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;
  const hostHeader = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase();
  const isStaffSubdomain =
    hostHeader.startsWith('team.uttarkunth.com') || hostHeader.startsWith('team.');

  // 1. Optional Cloudflare Access perimeter gate on team.uttarkunth.com
  // Note: Cloudflare Access never replaces application-level staff authentication, RBAC, or AAL2 MFA checks.
  if (isStaffSubdomain && process.env.ENFORCE_CLOUDFLARE_ACCESS === 'true') {
    const cfAccessJwt = request.headers.get('cf-access-jwt-assertion');
    if (!cfAccessJwt) {
      return new NextResponse(
        JSON.stringify({
          ok: false,
          error: 'Cloudflare Access verification required for team.uttarkunth.com.',
        }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // 2. Strictly prohibit open staff registration routes
  if (
    pathname === '/admin/register' ||
    pathname === '/admin/signup' ||
    pathname === '/staff/register' ||
    pathname === '/staff/signup'
  ) {
    const redirectUrl = new URL('/staff/login', request.url);
    redirectUrl.searchParams.set('error', 'open_registration_prohibited');
    return NextResponse.redirect(redirectUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user: { id: string; email?: string } | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value, '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, '', ...options });
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }

  // 3. Dedicated staff hostname root routing (team.uttarkunth.com -> /admin/dashboard or /staff/login)
  if (isStaffSubdomain && pathname === '/') {
    const targetPath = user ? '/admin/dashboard' : '/staff/login';
    return NextResponse.redirect(new URL(targetPath, request.url));
  }

  // 4. Strictly protect private routes — fail closed when unauthenticated.
  // Separate staff portal (/admin) from public member routes (/account, /host, /guest, /trips).
  if (!user) {
    if (pathname.startsWith('/admin')) {
      const redirectUrl = new URL('/staff/login', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (
      pathname.startsWith('/guest') ||
      pathname.startsWith('/host') ||
      pathname.startsWith('/account') ||
      pathname.startsWith('/trips')
    ) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. /logo.png)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
