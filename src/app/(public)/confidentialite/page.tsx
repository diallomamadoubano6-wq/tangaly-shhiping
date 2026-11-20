import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Eye, Database, Shield, Cookie, Mail, PhoneCall, Globe } from 'lucide-react';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité & Privacy Policy | TANGALY Shipping & Logistics',
  description: 'Découvrez comment TANGALY Shipping & Logistics protège et traite vos données personnelles lors de vos expéditions entre les USA et la Guinée (FR / EN).',
  alternates: {
    canonical: 'https://tangalyshipping.com/confidentialite',
  },
};

export default function ConfidentialitePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.badge}>
            <Lock size={14} /> Protection de la Vie Privée &amp; Données Personnelles / Privacy
          </div>
          <h1 className={styles.heroTitle}>Politique de Confidentialité</h1>
          <p className={styles.heroSubtitle}>
            Votre confiance est notre priorité. Découvrez comment TANGALY protège et sécurise vos données lors de chaque expédition entre les USA et la Guinée.
          </p>
          <div className={styles.heroMeta}>
            <span>Dernière mise à jour : Novembre 2026</span>
            <span>•</span>
            <span>Conforme aux normes de protection internationales (FR &amp; EN)</span>
          </div>
        </div>
      </section>

      <main className={styles.contentWrapper}>
        <div className={styles.card}>

          <div className={styles.bilingualNotice}>
            <Globe size={18} />
            <div>
              <strong>Privacy Commitment (FR / EN) :</strong><br />
              TANGALY Shipping &amp; Logistics strictly uses customer contact details and parcel information solely for logistics fulfillment, customs clearance, and secure tracking.
            </div>
          </div>

          {/* Section 1 : Introduction */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Shield size={20} />
              </div>
              <h2 className={styles.sectionTitle}>1. Responsable du Traitement / Data Controller</h2>
            </div>
            <p className={styles.paragraph}>
              Dans le cadre de ses opérations de transport international de fret aérien et maritime entre les États-Unis et la Guinée, <strong>TANGALY Shipping &amp; Logistics LLC</strong> (USA) et <strong>TANGALY Express Logistics SARL</strong> (Guinée) agissent conjointement en qualité de responsables du traitement des données personnelles.
            </p>
          </section>

          {/* Section 2 : Données collectées */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Database size={20} />
              </div>
              <h2 className={styles.sectionTitle}>2. Données Collectées / Information We Collect</h2>
            </div>
            <p className={styles.paragraph}>
              Nous ne collectons que les informations strictement nécessaires à la bonne exécution du transport et des formalités douanières :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Coordonnées de l&apos;expéditeur (Shipper) :</strong> Nom, prénom, téléphone, adresse à New York ou Conakry, email.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Coordonnées du destinataire (Consignee) :</strong> Nom complet, téléphone mobile de notification, ville et quartier de destination (Conakry, Labé, Kindia, Mamou, etc.).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Détails du colis (Cargo Details) :</strong> Description de la marchandise, poids brut (kg), volume (m³), valeur déclarée pour les douanes et l&apos;assurance, numéro d&apos;expédition (Tracking Number).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Données financières (Billing Data) :</strong> Montants facturés, acomptes encaissés, soldes et mode de règlement (Cash, Zelle, Orange Money, virement).</span>
              </li>
            </ul>
          </section>

          {/* Section 3 : Utilisation */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Eye size={20} />
              </div>
              <h2 className={styles.sectionTitle}>3. Utilisation des Données / How We Use Information</h2>
            </div>
            <p className={styles.paragraph}>
              Vos données sont exclusivement utilisées pour :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span>Générer vos bordereaux d&apos;expédition officiels et QR codes de traçabilité.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span>Vous transmettre en temps réel les notifications d&apos;arrivée de colis (SMS, WhatsApp, appels).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span>Accomplir les déclarations requises par les autorités douanières américaines (TSA, CBP) et guinéennes.</span>
              </li>
            </ul>
            <p className={styles.paragraph}>
              <strong>Aucune revente :</strong> TANGALY ne commercialise, ne loue et ne cède jamais vos données personnelles à des tiers publicitaires.
            </p>
          </section>

          {/* Section 4 : Cookies */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Cookie size={20} />
              </div>
              <h2 className={styles.sectionTitle}>4. Cookies &amp; Sécurité Technique</h2>
            </div>
            <p className={styles.paragraph}>
              Notre plateforme web utilise uniquement des cookies de session strictement techniques pour maintenir votre authentification sécurisée et mémoriser votre préférence de devise (USD ou GNF). Toutes les communications sont chiffrées selon le protocole de sécurité SSL/TLS (HTTPS).
            </p>
          </section>

          {/* Section 5 : Contact DPO */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Mail size={20} />
              </div>
              <h2 className={styles.sectionTitle}>5. Contact &amp; Exercice de vos Droits / Privacy Contact</h2>
            </div>
            <p className={styles.paragraph}>
              Vous disposez d&apos;un droit d&apos;accès, de rectification et d&apos;effacement de vos données personnelles sur simple demande adressée à notre délégué à la protection des données :
            </p>
            <div className={styles.infoBox}>
              <p style={{ margin: 0, fontSize: '0.925rem', color: '#1e293b' }}>
                <strong>Délégué à la Protection des Données — TANGALY Shipping</strong><br />
                <Mail size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Email : <a href="mailto:contact@tangalyshipping.com" style={{ color: '#2563eb', fontWeight: 600 }}>contact@tangalyshipping.com</a><br />
                <PhoneCall size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Téléphone USA : +1 (646) 382-0065 | Téléphone Guinée : +224 626 98 52 54
              </p>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
