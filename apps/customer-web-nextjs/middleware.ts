import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if user is authenticated by looking for token in cookies or headers
  // For now, we'll skip this and rely on client-side auth
  // In production, you'd verify JWT here
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/home/:path*',
    '/chefs/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/profile/:path*',
  ],
};
