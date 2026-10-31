'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, Users, Package, CreditCard, FileText, Settings,
  LogOut, CheckCircle, RotateCcw, ArrowLeftRight, 
  Scan, Calculator, Shield, X, Tag
} from 'lucide-react';
import styles from '../../app/admin/admin.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;

  const isActive = (path: string) => {
    return pathname === path || (path !== '/admin' && pathname.startsWith(`${path}/`));
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside 
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`} 
      aria-label="Navigation administration"
    >
      <div className={styles.logoArea}>
        <Image 
          src="/lo.jpeg" 
          alt="TANGALY" 
          width={180} 
          height={55} 
          style={{ objectFit: 'contain' }} 
        />
        {onClose && (
          <button 
            id="admin-sidebar-close"
            type="button" 
            className={styles.closeSidebar} 
            onClick={onClose} 
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className={styles.sidebarContent}>
        <div className={styles.profileCard}>
          <div className={styles.avatar} style={{ backgroundColor: '#facc15', color: '#1a202c' }}>
            {user?.nom?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className={styles.profileInfo}>
            <h3>{user?.nom || 'Administrateur Tangaly'}</h3>
            <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>
              {user?.role || 'Super Admin'}
            </span>
            <p><span style={{ color: '#10b981' }}>●</span> Accès complet</p>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navGroup}>
            <p className={styles.navTitle}>OPÉRATIONNEL</p>
            <Link href="/admin" onClick={handleLinkClick} className={isActive('/admin') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><LayoutDashboard size={18} /></div> Vue d&apos;ensemble
            </Link>
            <Link href="/admin/users" onClick={handleLinkClick} className={isActive('/admin/users') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Users size={18} /></div> Comptes & Accès
            </Link>
            <Link href="/admin/shipments" onClick={handleLinkClick} className={isActive('/admin/shipments') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Package size={18} /></div> Expéditions
            </Link>
            <Link href="/admin/scanner" onClick={handleLinkClick} className={isActive('/admin/scanner') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Scan size={18} /></div> Scanner QR
            </Link>
            <Link href="/admin/returns" onClick={handleLinkClick} className={isActive('/admin/returns') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><RotateCcw size={18} /></div> Retours
            </Link>
            <Link href="/admin/clients" onClick={handleLinkClick} className={isActive('/admin/clients') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Shield size={18} /></div> Clients
            </Link>
            <Link href="/admin/quotes" onClick={handleLinkClick} className={isActive('/admin/quotes') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><FileText size={18} /></div> Devis
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>FINANCES</p>
            <Link href="/admin/expenses" onClick={handleLinkClick} className={isActive('/admin/expenses') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><CreditCard size={18} /></div> Paiements
            </Link>
            <Link href="/admin/invoices" onClick={handleLinkClick} className={isActive('/admin/invoices') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><FileText size={18} /></div> Factures
            </Link>
            <Link href="/admin/transfers" onClick={handleLinkClick} className={isActive('/admin/transfers') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><ArrowLeftRight size={18} /></div> Virements
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>OUTILS & STATS</p>
            <Link href="/admin/calculator" onClick={handleLinkClick} className={isActive('/admin/calculator') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Calculator size={18} /></div> Calculateur interne
            </Link>
            <Link href="/admin/reports" onClick={handleLinkClick} className={isActive('/admin/reports') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><CheckCircle size={18} /></div> Rapports
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>LOGISTIQUE</p>
            <Link href="/admin/tarifs/articles" onClick={handleLinkClick} className={isActive('/admin/tarifs') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Tag size={18} /></div> Tarifs &amp; Articles
            </Link>
            <Link href="/admin/settings" onClick={handleLinkClick} className={isActive('/admin/settings') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Settings size={18} /></div> Paramètres
            </Link>
          </div>
        </nav>

        <div className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut size={18} />
          Déconnexion
        </div>
      </div>
    </aside>
  );
}
