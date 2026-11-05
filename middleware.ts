import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/types';

type CloudflareAccessJwk = JsonWebKey & {
  kid?: string;
  alg?: string;
  use?: string;
};

type CloudflareAccessClaims = {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
};

let cachedCloudflareAccessKeys: {
  issuer: string;
  expiresAt: number;
  keys: CloudflareAccessJwk[];
} | null = null;

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJwtJsonPart<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

async function getCloudflareAccessKeys(issuer: string, forceRefresh = false): Promise<CloudflareAccessJwk[]> {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedCloudflareAccessKeys &&
    cachedCloudflareAccessKeys.issuer === issuer &&
    cachedCloudflareAccessKeys.expiresAt > now
  ) {
    return cachedCloudflareAccessKeys.keys;
  }

  const response = await fetch(`${issuer}/cdn-cgi/access/certs`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Cloudflare Access signing keys could not be retrieved.');
  }

  const payload = (await response.json()) as { keys?: CloudflareAccessJwk[] };
  if (!Array.isArray(payload.keys) || payload.keys.length === 0) {
    throw new Error('Cloudflare Access did not return a valid signing key set.');
  }

  cachedCloudflareAccessKeys = {
    issuer,
    expiresAt: now + 5 * 60 * 1000,
    keys: payload.keys,
  };
  return payload.keys;
}

async function verifyCloudflareAccessJwt(
  token: string,
  portal: 'founder' | 'staff'
): Promise<boolean> {
  try {
    const teamDomain = (process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN || '').trim().toLowerCase();
    const expectedAudience = (
      portal === 'founder'
        ? process.env.CLOUDFLARE_ACCESS_AUD_FOUNDER
        : process.env.CLOUDFLARE_ACCESS_AUD_STAFF
    )?.trim();

    // Only accept the documented Cloudflare Access team issuer host; fail closed when configuration is missing.
    if (
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/.test(teamDomain) ||
      !expectedAudience
    ) {
      return false;
    }

    const issuer = `https://${teamDomain}`;
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const header = decodeJwtJsonPart<{ alg?: string; kid?: string }>(parts[0]);
    const claims = decodeJwtJsonPart<CloudflareAccessClaims>(parts[1]);
    if (header.alg !== 'RS256' || !header.kid) return false;

    const audienceMatches = Array.isArray(claims.aud)
      ? claims.aud.includes(expectedAudience)
      : claims.aud === expectedAudience;
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (
      claims.iss !== issuer ||
      !audienceMatches ||
      typeof claims.sub !== 'string' ||
      claims.sub.length === 0 ||
      typeof claims.exp !== 'number' ||
      claims.exp < nowSeconds - 60 ||
      (claims.nbf !== undefined &&
        (typeof claims.nbf !== 'number' || claims.nbf > nowSeconds + 60)) ||
      (claims.iat !== undefined &&
        (typeof claims.iat !== 'number' || claims.iat > nowSeconds + 60))
    ) {
      return false;
    }

    let keys = await getCloudflareAccessKeys(issuer);
    let signingKey = keys.find(
      (key) =>
        key.kid === header.kid &&
        key.kty === 'RSA' &&
        (!key.alg || key.alg === 'RS256') &&
        (!key.use || key.use === 'sig')
    );

    // Refresh once to handle a Cloudflare signing-key rotation.
    if (!signingKey) {
      keys = await getCloudflareAccessKeys(issuer, true);
      signingKey = keys.find(
        (key) =>
          key.kid === header.kid &&
          key.kty === 'RSA' &&
          (!key.alg || key.alg === 'RS256') &&
          (!key.use || key.use === 'sig')
      );
    }
    if (!signingKey) return false;

    const publicKey = await crypto.subtle.importKey(
      'jwk',
      signingKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      decodeBase64Url(parts[2]),
      signedContent
    );
  } catch {
    // Invalid, expired, malformed, or unverifiable Access tokens must never grant portal entry.
    return false;
  }
}

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
  // Use Next's parsed request URL hostname, not a client-supplied forwarded-host header.
  const hostHeader = request.nextUrl.hostname.toLowerCase();

  const isFounderSubdomain = hostHeader === 'admin.uttarkunth.com';
  const isStaffSubdomain = hostHeader === 'team.uttarkunth.com';

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

  // 1. Cryptographically verify Cloudflare Access on both internal hostnames in production.
  // Cloudflare Access is an outer perimeter gate; Supabase Auth, staff RBAC, and AAL2 remain mandatory.
  if (
    (isFounderSubdomain || isStaffSubdomain) &&
    (process.env.NODE_ENV === 'production' || process.env.ENFORCE_CLOUDFLARE_ACCESS === 'true')
  ) {
    const cfAccessJwt = request.headers.get('cf-access-jwt-assertion');
    const portal = isFounderSubdomain ? 'founder' : 'staff';
    const accessVerified = cfAccessJwt
      ? await verifyCloudflareAccessJwt(cfAccessJwt, portal)
      : false;

    if (!accessVerified) {
      return applySecurityHeaders(
        new NextResponse(
          JSON.stringify({
            ok: false,
            error: 'Cloudflare Access authorization failed. Verify the Access application and its configured audience.',
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
  }

  // 3. Dedicated portal hostname root & boundary routing
  // A. Founder Command Centre (admin.uttarkunth.com) -> Founder Only
  if (isFounderSubdomain) {
    if (pathname === '/') {
      const targetPath = user
        ? '/admin/dashboard'
        : '/staff/login?portal=founder&next=/admin/dashboard';
      return applySecurityHeaders(
        NextResponse.redirect(new URL(targetPath, request.url)),
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
    if (pathname === '/') {
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
    if (pathname === '/admin/staff' || pathname === '/admin/dashboard') {
      const targetPath = user ? '/staff' : '/staff/login?portal=staff&next=/staff';
      return applySecurityHeaders(
        NextResponse.redirect(new URL(targetPath, request.url)),
        portalKind
      );
    }
  }

  // C. Public Production Website (uttarkunth.com / www.uttarkunth.com) -> Strictly block /admin and /staff paths
  const hostWithoutPort = hostHeader;
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
      redirectUrl.searchParams.set('next', pathname);
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
