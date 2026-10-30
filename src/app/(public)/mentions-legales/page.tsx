import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ShieldCheck, Server, FileText, Scale, PhoneCall, Mail, MapPin } from 'lucide-react';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Mentions Légales | TANGALY Shipping & Logistics',
  description: 'Informations légales, identification de la société, hébergement et conditions d\'utilisation du site officiel TANGALY Shipping & Logistics.',
};

export default function MentionsLegalesPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.badge}>
            <Scale size={14} /> Informations Légales & Réglementaires
          </div>
          <h1 className={styles.heroTitle}>Mentions Légales</h1>
          <p className={styles.heroSubtitle}>
            Transparence, conformité juridique et informations relatives à l’édition et à l’hébergement de la plateforme TANGALY Shipping & Logistics.
          </p>
          <div className={styles.heroMeta}>
            <span>Dernière mise à jour : 30 Octobre 2026</span>
            <span>•</span>
            <span>Version officielle 2.0</span>
          </div>
        </div>
      </section>

      <main className={styles.contentWrapper}>
        <div className={styles.card}>
          
          {/* Section 1 : Éditeur */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Building2 size={20} />
              </div>
              <h2 className={styles.sectionTitle}>1. Éditeur de la Plateforme</h2>
            </div>
            <p className={styles.paragraph}>
              Le présent site internet accessible à l’adresse <strong>https://tangalylogistics.com</strong> (et ses sous-domaines associés) est édité et exploité conjointement par les entités du groupe <strong>TANGALY Shipping & Logistics</strong> :
            </p>

            <div className={styles.contactGrid}>
              <div className={styles.contactCard}>
                <div className={styles.contactCardTitle}>
                  <span>🇺🇸</span> Siège Social — États-Unis
                </div>
                <p className={styles.contactCardText}>
                  <strong>TANGALY Shipping & Logistics LLC</strong><br />
                  Société à responsabilité limitée de droit américain<br />
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  New York, NY — United States<br />
                  <Mail size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  contact@tangalylogistics.com<br />
                  <PhoneCall size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  +1 (234) 567-890
                </p>
              </div>

              <div className={styles.contactCard}>
                <div className={styles.contactCardTitle}>
                  <span>🇬🇳</span> Représentation — République de Guinée
                </div>
                <p className={styles.contactCardText}>
                  <strong>TANGALY Express Logistics SARL</strong><br />
                  Société enregistrée au Registre du Commerce et du Crédit Mobilier (RCCM)<br />
                  <MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  Conakry (Madina / Cité Enco5), République de Guinée<br />
                  <Mail size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  contact@tangaly.com<br />
                  <PhoneCall size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                  +224 620 00 00 00
                </p>
              </div>
            </div>

            <div className={styles.infoBox} style={{ marginTop: '1.25rem' }}>
              <div className={styles.infoBoxTitle}>
                <FileText size={16} color="#2563eb" /> Direction de la publication
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                <strong>Directeur de la publication :</strong> Mamadou Bah, Fondateur &amp; Gérant Général de TANGALY Shipping &amp; Logistics.
              </p>
            </div>
          </section>

          {/* Section 2 : Activité */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <ShieldCheck size={20} />
              </div>
              <h2 className={styles.sectionTitle}>2. Nature des Activités &amp; Services</h2>
            </div>
            <p className={styles.paragraph}>
              TANGALY Shipping &amp; Logistics propose des services d&apos;acheminement de fret, transport de colis commerciaux et personnels, et solutions d&apos;expédition internationale spécialisées entre l&apos;Amérique du Nord (USA) et la Guinée :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Fret Aérien (Air Freight) :</strong> Expéditions express régulières par avion avec délais optimisés (7 à 10 jours ouvrés).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Fret Maritime (Ocean Freight) :</strong> Envois de conteneurs, cartons volumineux, véhicules et marchandises industrielles.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Suivi en Ligne &amp; Tracking QR Code :</strong> Plateforme numérique de pointage en temps réel à chaque étape (New York, Transit, Conakry, Agences régionales).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Formalités Douanières &amp; Réception :</strong> Prise en charge des démarches de dédouanement et mise à disposition sécurisée dans nos agences de distribution.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 : Hébergeur */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Server size={20} />
              </div>
              <h2 className={styles.sectionTitle}>3. Hébergement du Site</h2>
            </div>
            <p className={styles.paragraph}>
              L&apos;infrastructure d&apos;hébergement et les serveurs de la plateforme web et de la base de données sont assurés par :
            </p>
            <div className={styles.infoBox}>
              <p style={{ margin: 0, fontSize: '0.925rem', color: '#1e293b' }}>
                <strong>Hostinger International Ltd.</strong><br />
                61 Lordou Vironos Street, 6023 Larnaca, Chypre<br />
                Site web officiel : <a href="https://www.hostinger.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>www.hostinger.com</a><br />
                Contact assistance : support@hostinger.com
              </p>
            </div>
          </section>

          {/* Section 4 : Propriété intellectuelle */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <FileText size={20} />
              </div>
              <h2 className={styles.sectionTitle}>4. Propriété Intellectuelle &amp; Marques</h2>
            </div>
            <p className={styles.paragraph}>
              Tous les éléments présents sur ce site (structure générale, code source, graphismes, logos, textes, photographies, vidéos, base de données, algorithme de tarification, système de génération de reçus et QR codes) sont la propriété exclusive de <strong>TANGALY Shipping &amp; Logistics</strong> ou de ses partenaires habilités.
            </p>
            <p className={styles.paragraph}>
              Toute reproduction, représentation, diffusion, adaptation ou exploitation, totale ou partielle, sans l&apos;accord exprès, préalable et écrit de la direction est formellement interdite et constitue une contrefaçon sanctionnée par les dispositions légales en vigueur.
            </p>
          </section>

          {/* Section 5 : Données personnelles */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Scale size={20} />
              </div>
              <h2 className={styles.sectionTitle}>5. Données Personnelles &amp; Confidentialité</h2>
            </div>
            <p className={styles.paragraph}>
              Conformément aux normes internationales de protection de la vie privée, TANGALY traite vos données personnelles uniquement dans le cadre de l&apos;exécution du contrat de transport, de la facturation et du suivi de vos colis.
            </p>
            <p className={styles.paragraph}>
              Pour consulter le détail de vos droits (accès, rectification, suppression) et notre politique de conservation des données, veuillez vous référer à notre{' '}
              <Link href="/confidentialite" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          {/* Section 6 : Limitation de responsabilité */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <ShieldCheck size={20} />
              </div>
              <h2 className={styles.sectionTitle}>6. Responsabilité &amp; Disponibilité</h2>
            </div>
            <p className={styles.paragraph}>
              TANGALY met en œuvre tous les moyens raisonnables pour assurer un accès continu et sécurisé à sa plateforme ainsi que l&apos;exactitude des statuts de suivi affichés. Toutefois, TANGALY ne saurait être tenue pour responsable en cas d&apos;interruption temporaire due à une opération de maintenance, à un cas de force majeure, ou aux aléas climatiques et contrôles douaniers impactant le fret international.
            </p>
            <p className={styles.paragraph}>
              Les conditions relatives à la responsabilité transporteur en cas de retard, avarie ou perte de marchandise sont régies par nos{' '}
              <Link href="/cgv" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>
                Conditions Générales de Vente (CGV)
              </Link>.
            </p>
          </section>

          {/* Section 7 : Contact */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <PhoneCall size={20} />
              </div>
              <h2 className={styles.sectionTitle}>7. Contact &amp; Réclamations</h2>
            </div>
            <p className={styles.paragraph}>
              Pour toute question d&apos;ordre juridique ou demande d&apos;information concernant ces mentions légales, vous pouvez contacter notre service juridique et support client :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Par courrier électronique :</strong> contact@tangalylogistics.com</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Par téléphone :</strong> +1 (234) 567-890 (USA) ou +224 620 00 00 00 (Guinée)</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Via notre formulaire en ligne :</strong> <Link href="/contact" style={{ color: '#2563eb', textDecoration: 'underline' }}>Page Contact</Link></span>
              </li>
            </ul>
          </section>

        </div>
      </main>
    </>
  );
}
