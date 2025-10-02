import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const jwt = req.cookies.get('candidate_jwt')?.value;
  if (jwt) {
    const requestHeaders = new Headers(req.headers);
    if (!requestHeaders.has('authorization')) {
      requestHeaders.set('authorization', 'Bearer ' + jwt);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/products',
    '/users',
    '/orders-list',
    '/admin',
    '/orders'
  ]
};