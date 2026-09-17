'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth(allowedRoles?: string[]) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  const user = session?.user as any;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'SUPER_ADMIN') router.replace('/admin');
        else if (user.role === 'CLIENT') router.replace('/client/dashboard');
        else router.replace('/operations');
      }
    }
  }, [user, isLoading, router, allowedRoles]);

  return { user, isLoading };
}
