'use client';

import { ReactNode } from 'react';
import { useRequireAuth } from '@/lib/useRequireAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useRequireAuth(allowedRoles);

  if (isLoading || !user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in useRequireAuth
  }

  return <>{children}</>;
}
