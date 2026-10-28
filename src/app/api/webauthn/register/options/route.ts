import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRegistrationOptions } from '@simplewebauthn/server';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const userEmail = session.user.email ?? '';

  // Get existing credentials so they can be excluded (prevent duplicate registrations)
  const existingPasskeys = await (prisma as any).passkey?.findMany({
    where: { userId },
    select: { credentialId: true, transports: true },
  }) ?? [];

  const options = await generateRegistrationOptions({
    rpName: 'Tangaly',
    rpID: process.env.WEBAUTHN_RP_ID ?? 'localhost',
    userName: userEmail,
    userDisplayName: session.user.name ?? userEmail,
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map((pk: any) => ({
      id: pk.credentialId,
      transports: (pk.transports?.split(',') as any) ?? [],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Store challenge in session via a short-lived cookie
  const response = NextResponse.json(options);
  response.cookies.set('webauthn_challenge', options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5, // 5 minutes
    path: '/',
  });
  // Also store userId so verify route knows who this belongs to
  response.cookies.set('webauthn_user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5,
    path: '/',
  });

  return response;
}
