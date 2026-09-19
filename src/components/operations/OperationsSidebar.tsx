'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, PlusSquare, List, MapPin, Package, Truck, 
  CheckCircle, RotateCcw, CreditCard, FileText, ArrowRightLeft, 
  Users, ScanLine, ListPlus, Calculator, Settings, LogOut, X 
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import styles from '../../app/operations/operations.module.css';

interface OperationsSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function OperationsSidebar({ isOpen, onClose }: OperationsSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  const isActive = (path: string) => {
    return pathname === path || (path !== '/operations' && pathname.startsWith(`${path}/`));
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside 
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
      aria-label="Navigation espace agent"
    >
      <div className={styles.logoArea}>
        <Image 
          src="/logo-tangaly.png" 
          alt="TANGALY" 
          width={130} 
          height={38} 
          style={{ objectFit: 'contain' }} 
        />
        {onClose && (
          <button 
            id="operations-sidebar-close"
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
          <div className={styles.avatar}>
            {user?.nom?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className={styles.profileInfo}>
            <h3>{user?.nom || 'Agent Tangaly'}</h3>
            <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>
              {user?.role || 'Agent Opérations'}
            </span>
            <p><span style={{ color: '#10b981' }}>●</span> {user?.localisation || 'Agence Principale'}</p>
          </div>
        </div>

        <nav className={styles.navLinks}>
          <div className={styles.navGroup}>
            <p className={styles.navTitle}>EXPÉDITIONS</p>
            <Link 
              href="/operations" 
              onClick={handleLinkClick} 
              className={pathname === '/operations' ? styles.navLinkActive : styles.navLink}
            >
              <LayoutDashboard size={18} />
              <span>Tableau de bord</span>
            </Link>
            <Link 
              href="/operations/new" 
              onClick={handleLinkClick} 
              className={isActive('/operations/new') ? styles.navLinkActive : styles.navLink}
            >
              <PlusSquare size={18} />
              <span>Nouvelle expédition</span>
            </Link>
            <Link 
              href="/operations/shipments" 
              onClick={handleLinkClick} 
              className={isActive('/operations/shipments') ? styles.navLinkActive : styles.navLink}
            >
              <List size={18} />
              <span>Liste des expéditions</span>
            </Link>
            <Link 
              href="/operations/tracking" 
              onClick={handleLinkClick} 
              className={isActive('/operations/tracking') ? styles.navLinkActive : styles.navLink}
            >
              <MapPin size={18} />
              <span>Suivi des colis</span>
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>COLIS & STATUTS</p>
            <Link 
              href="/operations/shipments?status=RECEIVED" 
              onClick={handleLinkClick} 
              className={styles.navLink}
            >
              <Package size={18} />
              <span>En attente de réception</span>
            </Link>
            <Link 
              href="/operations/shipments?status=SHIPPED" 
              onClick={handleLinkClick} 
              className={styles.navLink}
            >
              <Truck size={18} />
              <span>Colis en transit</span>
            </Link>
            <Link 
              href="/operations/shipments?status=DELIVERED" 
              onClick={handleLinkClick} 
              className={styles.navLink}
            >
              <CheckCircle size={18} />
              <span>Colis livrés</span>
            </Link>
            <Link 
              href="/operations/returns" 
              onClick={handleLinkClick} 
              className={isActive('/operations/returns') ? styles.navLinkActive : styles.navLink}
            >
              <RotateCcw size={18} />
              <span>Colis retournés</span>
            </Link>
          </div>

          <div className={styles.navGroup}>
            <p className={styles.navTitle}>FINANCES</p>
            <Link 
              href="/operations/expenses" 
              onClick={handleLinkClick} 
              className={isActive('/operations/expenses') ? styles.navLinkActive : styles.navLink}
            >
              <CreditCard size={18} />
              <span>Paiements</span>
            </Link>
            <Link 
              href="/operations/invoices" 
              onClick={handleLinkClick} 
              className={isActive('/operations/invoices') ? styles.navLinkActive : styles.navLink}
            >
              <FileText size={18} />
              <span>Factures</span>
            </Link>
            <Link 
              href="/operations/transfers" 
              onClick={handleLinkClick} 
              className={isActive('/operations/transfers') ? styles.navLinkActive : styles.navLink}
            >
              <ArrowRightLeft size={18} />
              <span>Virements</span>
            </Link>
          </div>
          
          <div className={styles.navGroup}>
            <p className={styles.navTitle}>CONTACTS</p>
            <Link 
              href="/operations/clients" 
              onClick={handleLinkClick} 
              className={isActive('/operations/clients') ? styles.navLinkActive : styles.navLink}
            >
              <Users size={18} />
              <span>Répertoire Clients</span>
            </Link>
          </div>
          
          <div className={styles.navGroup}>
            <p className={styles.navTitle}>OUTILS OPÉRATIONNELS</p>
            <Link 
              href="/operations/scanner" 
              onClick={handleLinkClick} 
              className={isActive('/operations/scanner') ? styles.navLinkActive : styles.navLink}
            >
              <ScanLine size={18} />
              <span>Scanner un Colis</span>
            </Link>
            <Link 
              href="/operations/reports" 
              onClick={handleLinkClick} 
              className={isActive('/operations/reports') ? styles.navLinkActive : styles.navLink}
            >
              <ListPlus size={18} />
              <span>Rapports Journaliers</span>
            </Link>
            <Link 
              href="/operations/calculator" 
              onClick={handleLinkClick} 
              className={isActive('/operations/calculator') ? styles.navLinkActive : styles.navLink}
            >
              <Calculator size={18} />
              <span>Devis / Calculette</span>
            </Link>
            <Link 
              href="/operations/settings" 
              onClick={handleLinkClick} 
              className={isActive('/operations/settings') ? styles.navLinkActive : styles.navLink}
            >
              <Settings size={18} />
              <span>Paramètres Agence</span>
            </Link>
          </div>
        </nav>

        <div 
          className={styles.logoutBtn} 
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut size={18} />
          Déconnexion
        </div>
      </div>
    </aside>
  );
}
