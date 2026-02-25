import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;
  
  const isLoginPage = pathname === '/login';
  const isRegisterPage = pathname === '/register';
  const isPublicPage = isLoginPage || isRegisterPage;

  // Redirect to dashboard if authenticated and on public page
  if (token && isPublicPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect to login if not authenticated and on protected page
  if (!token && !isPublicPage) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
