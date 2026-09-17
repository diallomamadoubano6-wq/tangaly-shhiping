'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusSquare, List, MapPin, Package, Truck, CheckCircle, RotateCcw, CreditCard, FileText, ArrowRightLeft, Users, ScanLine, ListPlus, Calculator, Settings, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import styles from '../../app/operations/operations.module.css';

export default function OperationsSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const logout = () => signOut({ callbackUrl: '/login' });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer} style={{ backgroundColor: '#ffffff', padding: '16px 16px 8px 16px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
        <img src="/logo-tangaly.png" alt="TANGALY" style={{height: '45px', objectFit: 'contain'}} />
      </div>

      <div className={styles.profileCard}>
        <div className={styles.avatar}>{user?.nom?.charAt(0) || 'D'}</div>
        <div className={styles.profileInfo}>
          <h3>{user?.nom || 'Diallo'}</h3>
          <span style={{fontSize: 12, color: '#94a3b8'}}>{user?.role || 'Agent'}</span>
          <p><span style={{color: '#10b981'}}>●</span> Agence Matam</p>
        </div>
      </div>

      <nav className={styles.navLinks}>
        <div style={{ padding: '0 16px 16px 16px' }}>
          <Link href="/operations" className={pathname === '/operations' ? styles.navLinkActive : styles.navLinkActive} style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}>
            <LayoutDashboard size={20} />
            <span>Tableau de bord</span>
          </Link>
        </div>
        
        <div className={styles.navGroup}>
          <h3 className={styles.navTitle}>Expéditions</h3>
          <Link href="/operations/new" className={pathname === '/operations/new' ? styles.navLinkActive : styles.navLink}>
            <PlusSquare size={20} />
            <span>Nouvelle expédition</span>
          </Link>
          <Link href="/operations/shipments" className={pathname === '/operations/shipments' ? styles.navLinkActive : styles.navLink}>
            <List size={20} />
            <span>Liste des expéditions</span>
          </Link>
          <Link href="/operations/tracking" className={pathname === '/operations/tracking' ? styles.navLinkActive : styles.navLink}>
            <MapPin size={20} />
            <span>Suivi des colis</span>
          </Link>
        </div>

        <div className={styles.navGroup}>
          <h3 className={styles.navTitle}>Colis</h3>
          <Link href="/operations/shipments?status=pending" className={styles.navLink}>
            <Package size={20} />
            <span>En attente de réception</span>
          </Link>
          <Link href="/operations/shipments?status=transit" className={styles.navLink}>
            <Truck size={20} />
            <span>Colis en transit</span>
          </Link>
          <Link href="/operations/shipments?status=delivered" className={styles.navLink}>
            <CheckCircle size={20} />
            <span>Colis livrés</span>
          </Link>
          <Link href="/operations/returns" className={pathname === '/operations/returns' ? styles.navLinkActive : styles.navLink}>
            <RotateCcw size={20} />
            <span>Colis retournés</span>
          </Link>
        </div>

        <div className={styles.navGroup}>
          <h3 className={styles.navTitle}>Finances</h3>
          <Link href="/operations/expenses" className={pathname === '/operations/expenses' ? styles.navLinkActive : styles.navLink}>
            <CreditCard size={20} />
            <span>Paiements</span>
          </Link>
          <Link href="/operations/invoices" className={pathname === '/operations/invoices' ? styles.navLinkActive : styles.navLink}>
            <FileText size={20} />
            <span>Factures</span>
          </Link>
          <Link href="/operations/transfers" className={pathname === '/operations/transfers' ? styles.navLinkActive : styles.navLink}>
            <ArrowRightLeft size={20} />
            <span>Virements</span>
          </Link>
        </div>
        
        <div className={styles.navGroup}>
          <h3 className={styles.navTitle}>Contacts</h3>
          <Link href="/operations/clients" className={pathname === '/operations/clients' ? styles.navLinkActive : styles.navLink}>
            <Users size={20} />
            <span>Répertoire Clients</span>
          </Link>
        </div>
        
        <div className={styles.navGroup}>
          <h3 className={styles.navTitle}>Outils</h3>
          <Link href="/operations/scanner" className={pathname === '/operations/scanner' ? styles.navLinkActive : styles.navLink}>
            <ScanLine size={20} />
            <span>Scanner un Colis</span>
          </Link>
          <Link href="/operations/reports" className={pathname === '/operations/reports' ? styles.navLinkActive : styles.navLink}>
            <ListPlus size={20} />
            <span>Rapports Journaliers</span>
          </Link>
          <Link href="/operations/calculator" className={pathname === '/operations/calculator' ? styles.navLinkActive : styles.navLink}>
            <Calculator size={20} />
            <span>Devis / Calculette</span>
          </Link>
          <Link href="/operations/settings" className={pathname === '/operations/settings' ? styles.navLinkActive : styles.navLink}>
            <Settings size={20} />
            <span>Paramètres Agence</span>
          </Link>
        </div>
      </nav>

      <div className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/login' })} style={{ cursor: 'pointer' }}>
        <LogOut size={18} />
        Déconnexion
      </div>
    </aside>
  );
}
