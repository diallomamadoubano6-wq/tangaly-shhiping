'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import styles from './ClientLayout.module.css';

const navItems = [
  { href: '/client/dashboard',  icon: '📊', label: 'Tableau de bord' },
  { href: '/client/shipments',  icon: '📦', label: 'Mes expéditions' },
  { href: '/client/quotes',     icon: '📋', label: 'Mes devis' },
  { href: '/client/documents',  icon: '📄', label: 'Documents' },
  { href: '/client/invoices',   icon: '💰', label: 'Factures' },
  { href: '/client/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/client/profile',    icon: '👤', label: 'Mon profil' },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} aria-label="Navigation espace client">
        {/* Logo */}
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <Image 
              src="/logo-tangaly.png" 
              alt="TANGALY Logo" 
              width={140} 
              height={40} 
              style={{ objectFit: 'contain', width: 'auto', height: '100%', maxHeight: '40px' }} 
            />
          </Link>
          <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)} aria-label="Fermer le menu">✕</button>
        </div>

        {/* Profil utilisateur */}
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>{user?.nom?.charAt(0) ?? 'C'}</div>
          <div>
            <p className={styles.userName}>{user?.nom ?? 'Client'}</p>
            <p className={styles.userEmail}>{user?.email ?? ''}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav} aria-label="Menu principal">
          <ul role="list">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Déconnexion */}
        <div className={styles.sidebarFooter}>
          <Link href="/tracking" className={styles.trackingLink}>
            🔍 Suivi public
          </Link>
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
            <span aria-hidden="true">🚪</span> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Contenu principal */}
      <div className={styles.main}>
        {/* Header mobile */}
        <header className={styles.header}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={sidebarOpen}
          >
            ☰
          </button>
          <span className={styles.headerTitle}>Espace Client</span>
          <div className={styles.headerAvatar}>{user?.nom?.charAt(0) ?? 'C'}</div>
        </header>

        {/* Page content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
