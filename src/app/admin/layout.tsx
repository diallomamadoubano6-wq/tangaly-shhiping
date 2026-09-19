import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { ToastProvider } from '@/components/ui/ToastProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export const metadata = {
  title: 'Administration | TANGALY',
  description: 'Tableau de bord CMS Tangaly Shipping',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
        <AdminLayoutClient>
          {children}
        </AdminLayoutClient>
      </ProtectedRoute>
    </ToastProvider>
  );
}
