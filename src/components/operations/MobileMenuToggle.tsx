'use client';

import { Menu } from 'lucide-react';
import styles from '../../app/operations/operations.module.css';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MobileMenuToggle() {
  const pathname = usePathname();

  // Fermer le menu si l'utilisateur change de page
  useEffect(() => {
    document.body.classList.remove('sidebar-open');
  }, [pathname]);

  const toggleMenu = () => {
    document.body.classList.toggle('sidebar-open');
  };

  return (
    <button 
      className={styles.mobileMenuBtn} 
      onClick={toggleMenu}
      aria-label="Toggle navigation menu"
    >
      <Menu size={24} />
    </button>
  );
}
