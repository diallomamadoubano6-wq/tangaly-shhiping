import OperationsLayoutClient from '@/components/operations/OperationsLayoutClient';
import { ToastProvider } from '@/components/ui/ToastProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export const metadata = {
  title: 'Espace Agent | TANGALY',
  description: 'Tableau de bord Agent Tangaly Shipping',
};

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT_USA', 'GERANT_GUINEE', 'AGENT']}>
        <OperationsLayoutClient>
          {children}
        </OperationsLayoutClient>
      </ProtectedRoute>
    </ToastProvider>
  );
}
