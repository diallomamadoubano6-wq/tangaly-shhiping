import Sidebar from '@/components/admin/Sidebar';
import { ToastProvider } from '@/components/ui/ToastProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Calendar, Bell, Shield } from 'lucide-react';
import styles from './admin.module.css';

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
      <div className={styles.adminContainer}>
        <Sidebar />
        <div className={styles.adminMain} suppressHydrationWarning={true}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h1>Bonjour, Administrateur ! 👋</h1>
              <p>Bienvenue dans le centre de contrôle.</p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.headerBadge}>
                <Calendar size={16} /> Aujourd'hui
              </div>
              <div className={styles.bell}>
                <Bell size={20} />
                <span className={styles.bellDot}></span>
              </div>
              <div className={styles.headerBadge}>
                <Shield size={16} /> Super Admin
              </div>
            </div>
          </header>
          <main className={styles.dashboard}>
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              {children}
            </ProtectedRoute>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
