'use client';

import React, { useState } from 'react';
import OperationsSidebar from './OperationsSidebar';
import { Calendar, Bell, Building2, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import styles from '../../app/operations/operations.module.css';

export default function OperationsLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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
              <h1>Bonjour, {user?.nom || 'Agent'} !</h1>
              <p>Bienvenue dans votre espace logistique & opérations.</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={`${styles.headerBadge} ${styles.badgeToday}`}>
              <Calendar size={16} /> {todayFormatted}
            </div>
            <div style={{ position: 'relative' }}>
              <div className={styles.bell} title="Notifications" onClick={() => setShowNotifications(!showNotifications)} style={{ cursor: 'pointer' }}>
                <Bell size={20} />
              </div>
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '120%', right: 0, width: 300, 
                  background: 'white', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', 
                  border: '1px solid #e2e8f0', zIndex: 100, padding: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h4 style={{ margin: 0, fontSize: 14, color: '#0f172a', fontWeight: 600 }}>Notifications</h4>
                    <span style={{ fontSize: 12, color: '#2563eb', cursor: 'pointer' }}>Tout marquer comme lu</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '30px 0', background: '#f8fafc', borderRadius: 6 }}>
                    Aucune nouvelle notification pour le moment.
                  </div>
                </div>
              )}
            </div>
            <div className={`${styles.headerBadge} ${styles.badgeAgency}`}>
              <Building2 size={16} /> {user?.localisation || 'Cité Enco5'}
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
