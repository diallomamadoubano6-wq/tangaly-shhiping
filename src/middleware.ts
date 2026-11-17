import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getAgentMarkdown } from '@/lib/agentMarkdown';

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protection des routes admin (Réservé exclusivement aux administrateurs)
    if (path.startsWith('/admin')) {
      const allowedAdminRoles = ['SUPER_ADMIN', 'ADMIN'];
      if (!token || !allowedAdminRoles.includes(token.role as string)) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
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

export default async function middleware(req: NextRequest, event: any) {
  const acceptHeader = req.headers.get('accept') || '';
  const path = req.nextUrl.pathname;

  // Servir du Markdown structuré lorsque les agents IA le réclament via Accept: text/markdown
  if (acceptHeader.includes('text/markdown')) {
    const md = getAgentMarkdown(path);
    return new NextResponse(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept',
      },
    });
  }

  // Protection des routes sous authentification
  if (path.startsWith('/admin') || path.startsWith('/client') || path.startsWith('/operations')) {
    return (authMiddleware as any)(req, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
