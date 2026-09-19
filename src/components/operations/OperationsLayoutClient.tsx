'use client';

import React, { useState } from 'react';
import OperationsSidebar from './OperationsSidebar';
import { Calendar, Bell, Building2, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import styles from '../../app/operations/operations.module.css';

export default function OperationsLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as any;

  // Format today's date in French
  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar drawer */}
      <OperationsSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop overlay on mobile/tablet */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content area */}
      <div className={styles.adminMain} suppressHydrationWarning={true}>
        <header className={styles.header}>
          <div className={styles.headerLeftWrap}>
            <button
              id="operations-menu-toggle"
              type="button"
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu agent"
              aria-expanded={sidebarOpen}
            >
              <Menu size={22} />
            </button>
            <div className={styles.headerLeft}>
              <h1>Bonjour, {user?.nom || 'Agent'} ! 👋</h1>
              <p>Bienvenue dans votre espace logistique & opérations.</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={`${styles.headerBadge} ${styles.badgeToday}`}>
              <Calendar size={16} /> {todayFormatted}
            </div>
            <div className={styles.bell} title="Notifications">
              <Bell size={20} />
              <span className={styles.bellDot}></span>
            </div>
            <div className={`${styles.headerBadge} ${styles.badgeAgency}`}>
              <Building2 size={16} /> {user?.localisation || 'Agence Matam'}
            </div>
          </div>
        </header>

        <main className={styles.dashboard}>
          {children}
        </main>
      </div>
    </div>
  );
}
