'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Calendar, Bell, Shield, Menu } from 'lucide-react';
import styles from '../../app/admin/admin.module.css';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar navigation drawer */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile/Tablet Backdrop overlay */}
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
              id="admin-menu-toggle"
              type="button"
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu d'administration"
              aria-expanded={sidebarOpen}
            >
              <Menu size={22} />
            </button>
            <div className={styles.headerLeft}>
              <h1>Bonjour, Administrateur !</h1>
              <p>Bienvenue dans le centre de contrôle.</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={`${styles.headerBadge} ${styles.badgeToday}`}>
              <Calendar size={16} /> Aujourd'hui
            </div>
            <div className={styles.bell} title="Notifications">
              <Bell size={20} />
              <span className={styles.bellDot}></span>
            </div>
            <div className={`${styles.headerBadge} ${styles.badgeRole}`}>
              <Shield size={16} /> Super Admin
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
