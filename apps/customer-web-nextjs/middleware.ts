import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes - no auth required
  const publicRoutes = ['/order'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  
  // Auth routes
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

  // Protected routes
  const protectedRoutes = ['/profile', '/orders'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to customer home if already authenticated and on auth page
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/customer', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/login',
    '/signup',
  ],
};
