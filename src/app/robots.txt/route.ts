import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const robotsTxt = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /client/',
    'Disallow: /operations/',
    'Disallow: /api/auth/',
    '',
    'Content-Signal: search=yes, ai-train=no',
    '',
    'Sitemap: https://tangalyshipping.com/sitemap.xml',
    '',
  ].join('\n');

  return new NextResponse(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
    },
  });
}

