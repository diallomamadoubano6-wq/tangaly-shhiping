'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LayoutDashboard, Users, Package, CreditCard, FileText, Settings, Database, LogOut, FileSearch, Shield, PlusSquare, List, MapPin, Truck, CheckCircle, RotateCcw, ArrowLeftRight, Scan, Calculator } from 'lucide-react';
import styles from '../../app/admin/admin.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  const isActive = (path: string) => {
    return pathname === path || (path !== '/admin' && pathname.startsWith(`${path}/`));
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <Image src="/logo-tangaly.png" alt="TANGALY" width={140} height={40} style={{ objectFit: 'contain' }} />
      </div>

      <div className={styles.sidebarContent}>
        <div className={styles.profileCard}>
          <div className={styles.avatar} style={{ backgroundColor: '#facc15', color: '#1a202c' }}>
            {user?.nom?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className={styles.profileInfo}>
            <h3>{user?.nom || 'Administrateur Tangaly'}</h3>
            <span style={{fontSize: 12, color: '#94a3b8', textTransform: 'uppercase'}}>{user?.role || 'Super Admin'}</span>
            <p><span style={{color: '#10b981'}}>●</span> Accès complet</p>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navGroup}>
            <p className={styles.navTitle}>OPÉRATIONNEL</p>
            <Link href="/admin" className={isActive('/admin') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><LayoutDashboard size={18} /></div> Vue d'ensemble
            </Link>
            <Link href="/admin/users" className={isActive('/admin/users') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Users size={18} /></div> Comptes & Accès
            </Link>
            <Link href="/admin/shipments" className={isActive('/admin/shipments') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Package size={18} /></div> Expéditions
            </Link>
            <Link href="/admin/scanner" className={isActive('/admin/scanner') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Scan size={18} /></div> Scanner QR
            </Link>
            <Link href="/admin/returns" className={isActive('/admin/returns') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><RotateCcw size={18} /></div> Retours
            </Link>
            <Link href="/admin/clients" className={isActive('/admin/clients') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Shield size={18} /></div> Clients
            </Link>
            <Link href="/admin/quotes" className={isActive('/admin/quotes') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><FileText size={18} /></div> Devis
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>FINANCES</p>
            <Link href="/admin/expenses" className={isActive('/admin/expenses') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><CreditCard size={18} /></div> Paiements
            </Link>
            <Link href="/admin/invoices" className={isActive('/admin/invoices') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><FileText size={18} /></div> Factures
            </Link>
            <Link href="/admin/transfers" className={isActive('/admin/transfers') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><ArrowLeftRight size={18} /></div> Virements
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>OUTILS & STATS</p>
            <Link href="/admin/calculator" className={isActive('/admin/calculator') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Calculator size={18} /></div> Calculateur interne
            </Link>
            <Link href="/admin/reports" className={isActive('/admin/reports') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><CheckCircle size={18} /></div> Rapports
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>LOGISTIQUE</p>
            <Link href="/admin/services" className={isActive('/admin/services') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><Database size={18} /></div> Services
            </Link>
            <Link href="/admin/tarifs" className={isActive('/admin/tarifs') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><CreditCard size={18} /></div> Tarifs & Zones
            </Link>
            <Link href="/admin/agences" className={isActive('/admin/agences') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><MapPin size={18} /></div> Agences
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>CONTENU (CMS)</p>
            <Link href="/admin/cms" className={isActive('/admin/cms') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><FileSearch size={18} /></div> Accueil (Hero & Stats)
            </Link>
            <Link href="/admin/pages" className={isActive('/admin/pages') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><FileText size={18} /></div> Gestion des Pages
            </Link>
            <Link href="/admin/blog" className={isActive('/admin/blog') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><FileText size={18} /></div> Articles de Blog
            </Link>
            <Link href="/admin/faq" className={isActive('/admin/faq') ? styles.navLinkActive : styles.navLink}>
              <div className={styles.iconWrapper}><FileText size={18} /></div> Foire aux Questions
            </Link>
            <Link href="/admin/settings" className={isActive('/admin/settings') ? styles.navLinkActive : styles.navLink}>
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

