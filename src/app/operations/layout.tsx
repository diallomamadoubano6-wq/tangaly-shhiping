import OperationsSidebar from '@/components/operations/OperationsSidebar';
import MobileMenuToggle from '@/components/operations/MobileMenuToggle';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { Calendar, Bell, Building2 } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import styles from './operations.module.css';

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
      <div className={styles.adminContainer} suppressHydrationWarning={true}>
        <OperationsSidebar />
        <div className={styles.adminMain} suppressHydrationWarning={true}>
          <header className={styles.header}>
            <div className={styles.headerLeft} style={{ display: 'flex', alignItems: 'center' }}>
              <MobileMenuToggle />
              <div>
                <h1>Bonjour, Diallo ! 👋</h1>
                <p>Bienvenue dans votre espace agent.</p>
              </div>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.headerBadge}>
                <Calendar size={16} /> Vendredi 29 Août 2026
              </div>
              <div className={styles.bell}>
                <Bell size={20} />
                <span className={styles.bellDot}></span>
              </div>
              <div className={styles.headerBadge}>
                <Building2 size={16} /> Agence Matam
              </div>
            </div>
          </header>
          <main className={styles.dashboard}>
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'GERANT_USA', 'GERANT_GUINEE', 'AGENT']}>
              {children}
            </ProtectedRoute>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
