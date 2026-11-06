import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

function applySecurityHeaders(res: NextResponse, portalKind: 'founder' | 'staff' | 'public'): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-Uttarkunth-Portal', portalKind);
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostHeader = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase();

  const isFounderSubdomain =
    hostHeader.startsWith('admin.uttarkunth.com') || hostHeader.startsWith('admin.');
  const isStaffSubdomain =
    hostHeader.startsWith('team.uttarkunth.com') || hostHeader.startsWith('team.');

  const portalKind: 'founder' | 'staff' | 'public' = isFounderSubdomain
    ? 'founder'
    : isStaffSubdomain
      ? 'staff'
      : 'public';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-uttarkunth-portal', portalKind);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 1. Optional Cloudflare Access perimeter gate on admin.uttarkunth.com and team.uttarkunth.com
  // Note: Cloudflare Access never replaces application-level staff authentication, RBAC, or AAL2 MFA checks.
  if (
    (isFounderSubdomain || isStaffSubdomain) &&
    process.env.ENFORCE_CLOUDFLARE_ACCESS === 'true'
  ) {
    const cfAccessJwt = request.headers.get('cf-access-jwt-assertion');
    if (!cfAccessJwt) {
      return applySecurityHeaders(
        new NextResponse(
          JSON.stringify({
            ok: false,
            error: `Cloudflare Access verification required for ${
              isFounderSubdomain ? 'admin.uttarkunth.com' : 'team.uttarkunth.com'
            }.`,
          }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        ),
        portalKind
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
    return applySecurityHeaders(NextResponse.redirect(redirectUrl), portalKind);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let user: { id: string; email?: string } | null = null;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response = NextResponse.next({
              request: {
                headers: requestHeaders,
              },
            });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    } catch {
      user = null;
    }
  }

  // 3. Dedicated portal hostname root & boundary routing
  // A. Founder Command Centre (admin.uttarkunth.com) -> Founder Only
  if (isFounderSubdomain) {
    if (pathname === '/' || pathname === '/admin' || pathname === '/dashboard') {
      const targetPath = user
        ? '/admin/dashboard'
        : '/staff/login?portal=founder&next=/admin/dashboard';
      return applySecurityHeaders(
        NextResponse.redirect(new URL(targetPath, request.url)),
        portalKind
      );
    }

    if (pathname === '/admin/login') {
      return applySecurityHeaders(
        NextResponse.redirect(
          new URL('/staff/login?portal=founder&next=/admin/dashboard', request.url)
        ),
        portalKind
      );
    }

    // Block public member routes on admin.uttarkunth.com
    if (
      pathname === '/signup' ||
      pathname === '/login' ||
      pathname.startsWith('/account') ||
      pathname.startsWith('/host') ||
      pathname.startsWith('/guest') ||
      pathname.startsWith('/trips')
    ) {
      const targetPath = user
        ? '/admin/dashboard'
        : '/staff/login?portal=founder&next=/admin/dashboard';
      return applySecurityHeaders(
        NextResponse.redirect(new URL(targetPath, request.url)),
        portalKind
      );
    }
  }

  // B. Staff Portal (team.uttarkunth.com) -> Approved Staff & Founder
  if (isStaffSubdomain) {
    if (pathname === '/' || pathname === '/dashboard' || pathname === '/staff/dashboard') {
      const targetPath = user ? '/staff' : '/staff/login?portal=staff&next=/staff';
      return applySecurityHeaders(
        NextResponse.redirect(new URL(targetPath, request.url)),
        portalKind
      );
    }

    // Block public member routes on team.uttarkunth.com
    if (
      pathname === '/signup' ||
      pathname === '/login' ||
      pathname.startsWith('/account') ||
      pathname.startsWith('/host') ||
      pathname.startsWith('/guest') ||
      pathname.startsWith('/trips')
    ) {
      const targetPath = user ? '/staff' : '/staff/login?portal=staff&next=/staff';
      return applySecurityHeaders(
        NextResponse.redirect(new URL(targetPath, request.url)),
        portalKind
      );
    }

    // Block Founder-only governance routes on team.uttarkunth.com
    if (pathname === '/admin/staff' || pathname === '/admin/dashboard' || pathname === '/admin') {
      const targetPath = user ? '/staff' : '/staff/login?portal=staff&next=/staff';
      return applySecurityHeaders(
        NextResponse.redirect(new URL(targetPath, request.url)),
        portalKind
      );
    }
  }

  // C. Public Production Website (uttarkunth.com / www.uttarkunth.com) -> Strictly block /admin and /staff paths
  const hostWithoutPort = hostHeader.split(':')[0];
  const isPublicProductionDomain =
    hostWithoutPort === 'uttarkunth.com' || hostWithoutPort === 'www.uttarkunth.com';
  if (
    isPublicProductionDomain &&
    (pathname.startsWith('/admin') || pathname.startsWith('/staff'))
  ) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/', request.url)),
      portalKind
    );
  }

  // 4. Strictly protect private routes — fail closed when unauthenticated.
  // Separate staff/founder portals (/admin, /staff) from public member routes (/account, /host, /guest, /trips).
  const isProtectedStaffRoute =
    pathname.startsWith('/admin') ||
    (pathname.startsWith('/staff') &&
      !pathname.startsWith('/staff/login') &&
      !pathname.startsWith('/staff/onboard'));

  if (!user) {
    if (isProtectedStaffRoute) {
      const redirectUrl = new URL('/staff/login', request.url);
      const safeNext =
        pathname === '/admin' || pathname === '/admin/' ? '/admin/dashboard' : pathname;
      redirectUrl.searchParams.set('next', safeNext);
      if (isFounderSubdomain) {
        redirectUrl.searchParams.set('portal', 'founder');
      } else if (isStaffSubdomain) {
        redirectUrl.searchParams.set('portal', 'staff');
      }
      return applySecurityHeaders(NextResponse.redirect(redirectUrl), portalKind);
    }

    if (
      pathname.startsWith('/guest') ||
      pathname.startsWith('/host') ||
      pathname.startsWith('/account') ||
      pathname.startsWith('/trips')
    ) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return applySecurityHeaders(NextResponse.redirect(redirectUrl), portalKind);
    }
  }

  return applySecurityHeaders(response, portalKind);
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
