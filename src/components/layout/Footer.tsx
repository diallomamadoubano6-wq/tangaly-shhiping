import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';
import styles from './Footer.module.css';

const footerLinks = {
  services: [
    { href: '/services', label: 'Tous nos services' },
    { href: '/tracking', label: 'Suivi de colis' },
    { href: '/devis', label: 'Demande de devis' },
  ],
  company: [
    { href: '/about', label: 'À propos de TANGALY' },
    { href: '/blog', label: 'Actualités' },
    { href: '/contact', label: 'Contactez-nous' },
  ],
  legal: [
    { href: '/mentions-legales', label: 'Mentions légales' },
    { href: '/confidentialite', label: 'Confidentialité' },
    { href: '/cgv', label: 'CGV' },
  ],
};

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className="container">
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <div className={styles.logoBg}>
                <Image 
                  src="/logo-tangaly.png" 
                  alt="TANGALY Logo" 
                  width={160} 
                  height={50} 
                  style={{ objectFit: 'contain', width: 'auto', height: '100%', maxHeight: '50px' }} 
                />
              </div>
            </div>
            <p className={styles.tagline}>
              Votre partenaire logistique de confiance entre les États-Unis et la Guinée.
            </p>
            <div className={styles.socials} aria-label="Réseaux sociaux">
              <a href="#" aria-label="Facebook" className={styles.social}>f</a>
              <a href="#" aria-label="WhatsApp" className={styles.social}>W</a>
              <a href="#" aria-label="Instagram" className={styles.social}>in</a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className={styles.colTitle}>Services</h3>
            <ul className={styles.linkList}>
              {footerLinks.services.map((l) => (
                <li key={l.href}><Link href={l.href} className={styles.footerLink}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className={styles.colTitle}>Entreprise</h3>
            <ul className={styles.linkList}>
              {footerLinks.company.map((l) => (
                <li key={l.href}><Link href={l.href} className={styles.footerLink}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={styles.colTitle}>Contact</h3>
            <address className={styles.address}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} className="text-primary" /> +1 (555) 000-0000</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} className="text-primary" /> contact@tangaly.com</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} className="text-primary" /> New York, USA</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} className="text-primary" /> Conakry, Guinée</p>
            </address>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} TANGALY Shipping & Logistics. Tous droits réservés.</p>
          <ul className={styles.legalLinks}>
            {footerLinks.legal.map((l) => (
              <li key={l.href}><Link href={l.href} className={styles.footerLink}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
