import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEV_BYPASS = process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === '1';

export function middleware(req: NextRequest) {
  if (DEV_BYPASS) {
    return NextResponse.next();
  }
  // No-op middleware for now; route-level guards handle auth/tenant checks.
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*', '/(dashboard)(.*)'],
};
