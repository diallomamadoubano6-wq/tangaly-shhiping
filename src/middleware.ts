import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protection des routes admin
    if (path.startsWith('/admin') && token?.role !== 'SUPER_ADMIN' && token?.role !== 'AGENT') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Protection des routes client
    if (path.startsWith('/client') && !token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Protection des routes operations
    if (path.startsWith('/operations')) {
      const allowedRoles = ['SUPER_ADMIN', 'GERANT_USA', 'GERANT_GUINEE', 'AGENT'];
      if (!token || !allowedRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/client/:path*', '/admin/:path*', '/operations/:path*'],
};
