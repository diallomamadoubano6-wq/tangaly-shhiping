import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ShieldCheck, Server, FileText, Scale, PhoneCall, Mail, MapPin, Globe } from 'lucide-react';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Mentions Légales & Legal Notice | TANGALY Shipping & Logistics',
  description: 'Informations légales, identification des sociétés (USA & Guinée), hébergement et conditions d\'utilisation du site officiel TANGALY Shipping & Logistics.',
  alternates: {
    canonical: 'https://tangalyshipping.com/mentions-legales',
  },
};

export default function MentionsLegalesPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.badge}>
            <Scale size={14} /> Informations Légales &amp; Réglementaires / Legal Notice
          </div>
          <h1 className={styles.heroTitle}>Mentions Légales</h1>
          <p className={styles.heroSubtitle}>
            Transparence, conformité juridique et informations corporatives relatives aux entités américaine et guinéenne de TANGALY Shipping &amp; Logistics.
          </p>
          <div className={styles.heroMeta}>
            <span>Dernière mise à jour : Novembre 2026</span>
            <span>•</span>
            <span>Version officielle bilingue FR / EN</span>
          </div>
        </div>
      </section>

      <main className={styles.contentWrapper}>
        <div className={styles.card}>
          
          <div className={styles.bilingualNotice}>
            <Globe size={18} />
            <div>
              <strong>Bilingual Corporate Notice / Identification des Entités :</strong><br />
              TANGALY Shipping operates legitimately in the United States and the Republic of Guinea under dual incorporated entities.
            </div>
          </div>

          {/* Section 1 : Éditeur */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Building2 size={20} />
              </div>
              <h2 className={styles.sectionTitle}>1. Éditeur de la Plateforme / Corporate Identification</h2>
            </div>
            <p className={styles.paragraph}>
              Le présent site internet accessible à l’adresse <strong>https://tangalyshipping.com</strong> est édité et exploité conjointement par les entités juridiques du groupe <strong>TANGALY Shipping &amp; Logistics</strong> :
            </p>

            <div className={styles.contactGrid}>
              <div className={styles.contactCard}>
                <div className={styles.contactCardTitle}>
                  <span>🇺🇸</span> États-Unis / United States
                </div>
                <p className={styles.contactCardText}>
                  <strong>TANGALY Shipping &amp; Logistics LLC</strong><br />
                  Limited Liability Company registered in New York, USA<br />
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  3429 3rd Ave, Bronx, NY 10456, United States<br />
                  <Mail size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  <a href="mailto:contact@tangalyshipping.com" style={{ color: '#2563eb' }}>contact@tangalyshipping.com</a><br />
                  <PhoneCall size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  +1 (646) 382-0065
                </p>
              </div>

              <div className={styles.contactCard}>
                <div className={styles.contactCardTitle}>
                  <span>🇬🇳</span> Guinée / Republic of Guinea
                </div>
                <p className={styles.contactCardText}>
                  <strong>TANGALY Express Logistics SARL</strong><br />
                  Société à Responsabilité Limitée immatriculée au RCCM<br />
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Cité Enco 5, Conakry, République de Guinée<br />
                  <Mail size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  <a href="mailto:contact@tangalyshipping.com" style={{ color: '#2563eb' }}>contact@tangalyshipping.com</a><br />
                  <PhoneCall size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  +224 626 98 52 54
                </p>
              </div>
            </div>

            <div className={styles.infoBox} style={{ marginTop: '1.25rem' }}>
              <div className={styles.infoBoxTitle}>
                <FileText size={16} color="#2563eb" /> Direction de la Publication / Management
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                <strong>Directeur de la publication :</strong> Mamadou Bano Diallo, Fondateur &amp; Directeur Général de TANGALY Shipping &amp; Logistics.
              </p>
            </div>
          </section>

          {/* Section 2 : Activité */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <ShieldCheck size={20} />
              </div>
              <h2 className={styles.sectionTitle}>2. Nature des Activités / Nature of Services</h2>
            </div>
            <p className={styles.paragraph}>
              TANGALY Shipping &amp; Logistics fournit des solutions logistiques intégrées de transport international de fret bilatéral entre l&apos;Amérique du Nord (USA) et la Guinée :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Fret Aérien Express (Air Freight) :</strong> Expéditions aériennes rapides hebdomadaires dans les deux sens (USA ➔ Guinée et Guinée ➔ USA).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Fret Maritime Sécurisé (Ocean Freight) :</strong> Envois de conteneurs de groupage, barils et cartons volumineux.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Traçabilité QR Code &amp; Plateforme Web :</strong> Système propriétaire de pointage et de suivi en temps réel pour l&apos;expéditeur et le destinataire.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Dédouanement &amp; Distribution Locale :</strong> Prise en charge des formalités douanières et mise à disposition dans les agences de Conakry et villes régionales.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 : Hébergeur */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Server size={20} />
              </div>
              <h2 className={styles.sectionTitle}>3. Hébergement de l&apos;Infrastructure / Cloud Hosting</h2>
            </div>
            <p className={styles.paragraph}>
              L&apos;infrastructure serveur, l&apos;application web Next.js et la base de données sécurisée sont hébergées par :
            </p>
            <div className={styles.infoBox}>
              <p style={{ margin: 0, fontSize: '0.925rem', color: '#1e293b' }}>
                <strong>Hostinger International Ltd.</strong><br />
                61 Lordou Vironos Street, 6023 Larnaca, Chypre<br />
                Site web officiel : <a href="https://www.hostinger.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>www.hostinger.com</a>
              </p>
            </div>
          </section>

          {/* Section 4 : Propriété intellectuelle */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <FileText size={20} />
              </div>
              <h2 className={styles.sectionTitle}>4. Propriété Intellectuelle / Intellectual Property</h2>
            </div>
            <p className={styles.paragraph}>
              L&apos;ensemble des contenus (marques TANGALY, logotypes, logiciels, code source, interfaces de suivi, système de QR codes et base de données) sont protégés par les lois internationales sur la propriété intellectuelle. Toute reproduction non autorisée est strictement interdite.
            </p>
          </section>

          {/* Section 5 : Liens contractuels */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Scale size={20} />
              </div>
              <h2 className={styles.sectionTitle}>5. Conditions Contractuelles &amp; Vie Privée</h2>
            </div>
            <p className={styles.paragraph}>
              Pour connaître le cadre détaillé de nos prestations de transport, les barèmes de responsabilité en cas de perte de colis et les règles de protection de vos données, veuillez consulter :
            </p>
            <div className="flex gap-4 flex-wrap" style={{ marginTop: '0.75rem' }}>
              <Link href="/cgv" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                Consulter les CGV (Terms of Service)
              </Link>
              <Link href="/confidentialite" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                Politique de Confidentialité (Privacy Policy)
              </Link>
            </div>
          </section>

          {/* Section 6 : Contact */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <PhoneCall size={20} />
              </div>
              <h2 className={styles.sectionTitle}>6. Service Client &amp; Support Bilingue (FR / EN)</h2>
            </div>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Email officiel :</strong> <a href="mailto:contact@tangalyshipping.com" style={{ color: '#2563eb', fontWeight: 600 }}>contact@tangalyshipping.com</a></span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Bureau New York (USA) :</strong> +1 (646) 382-0065</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Bureau Conakry (Guinée) :</strong> +224 626 98 52 54</span>
              </li>
            </ul>
          </section>

        </div>
      </main>
    </>
  );
}
