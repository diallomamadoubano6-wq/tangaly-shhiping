'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from './Header.module.css';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/services', label: 'Nos Services' },
  { href: '/tracking', label: 'Suivre mon colis' },
  { href: '/devis', label: 'Devis gratuit' },
  { href: '/about', label: 'À propos' },
  { href: '/blog', label: 'Actualités' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientLink, setClientLink] = useState('/client/login');

  useEffect(() => {
    // Vérifier si une session existe et rediriger vers le bon espace
    try {
      const token = localStorage.getItem('tangaly_client_token');
      const userStr = localStorage.getItem('tangaly_client_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'SUPER_ADMIN') {
          setClientLink('/admin');
        } else if (['GERANT_USA', 'GERANT_GUINEE', 'AGENT'].includes(user.role)) {
          setClientLink('/operations');
        } else {
          setClientLink('/client/dashboard');
        }
      }
    } catch { /* Ignorer les erreurs de parse */ }
  }, []);

  return (
    <header className={styles.header} role="banner">
      <div className="container">
        <nav className={styles.nav} aria-label="Navigation principale">
          {/* Logo */}
          <Link href="/" className={styles.logo} aria-label="TANGALY - Accueil">
            <Image 
              src="/logo-tangaly.png" 
              alt="TANGALY Logo" 
              width={160} 
              height={50} 
              style={{ objectFit: 'contain', width: 'auto', height: '100%', maxHeight: '50px' }} 
              priority
            />
          </Link>

          {/* Desktop nav */}
          <ul className={styles.desktopLinks} role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA + hamburger */}
          <div className={styles.actions}>
            <Link href={clientLink} className={`btn btn-outline btn-sm ${styles.ctaDesktop}`}>
              Espace client
            </Link>
            <button type="button"
              className={styles.hamburger}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
            >
              <span className={menuOpen ? styles.barTop + ' ' + styles.barTopOpen : styles.barTop} />
              <span className={menuOpen ? styles.barMid + ' ' + styles.barMidOpen : styles.barMid} />
              <span className={menuOpen ? styles.barBot + ' ' + styles.barBotOpen : styles.barBot} />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={styles.mobileMenu} id="mobile-menu" role="dialog" aria-label="Menu mobile">
          <ul role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={clientLink}
                className={`btn btn-primary ${styles.mobileCta}`}
                onClick={() => setMenuOpen(false)}
              >
                Espace client
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
