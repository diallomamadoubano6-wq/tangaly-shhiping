import type { Metadata } from 'next';
import styles from './services.module.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nos Services',
  description: 'Découvrez tous les services logistiques de TANGALY : fret aérien, maritime, consolidation et solutions B2B pour le transport USA ↔ Guinée.',
};

async function getServices() {
  // À connecter à l'API : fetch(`${process.env.API_URL}/api/services`)
  return [
    {
      icon: '✈️', title: 'Fret Aérien Express', slug: 'fret-aerien',
      description: 'La solution la plus rapide pour vos expéditions urgentes entre les USA et la Guinée (dans les deux sens). Délai garanti sous 48-72h.',
      features: ['Liaison USA ↔ Guinée', 'Livraison express 48-72h', 'Suivi en temps réel', 'Assurance incluse'],
      prix: 'À partir de 8$/kg',
    },
    {
      icon: '🚢', title: 'Fret Maritime', slug: 'fret-maritime',
      description: 'La solution économique pour les grandes quantités et conteneurs entre les États-Unis et le port de Conakry.',
      features: ['Départs réguliers dans les 2 sens', 'Conteneurs FCL & LCL', 'Transit 15-21 jours', 'Dédouanement sécurisé'],
      prix: 'À partir de 350$/m³',
    },
    {
      icon: '📦', title: 'Consolidation & Groupage', slug: 'consolidation',
      description: 'Regroupez vos petits colis pour bénéficier de tarifs de groupe attractifs, au départ des USA ou de la Guinée.',
      features: ['Économies d\'échelle', 'Tarif groupé avantageux', 'Collecte à New York & Conakry', 'Flexible et sécurisé'],
      prix: 'À partir de 5$/kg',
    },
    {
      icon: '🏢', title: 'Solutions B2B', slug: 'b2b',
      description: 'Contrats dédiés aux professionnels et commerçants avec tarification préférentielle et suivi sur-mesure.',
      features: ['Tarifs préférentiels', 'Gestionnaire dédié', 'Facturation mensuelle', 'SLA garanti'],
      prix: 'Sur devis',
    },
    {
      icon: '🏠', title: 'Déménagement', slug: 'demenagement',
      description: 'Installation aux USA ou retour en Guinée : transfert de vos effets personnels et mobilier en toute tranquillité.',
      features: ['Emballage professionnel', 'Transport sécurisé', 'Assurance tous risques', 'Livraison à domicile'],
      prix: 'Sur devis',
    },
    {
      icon: '🛒', title: 'Shopping & Adresses Relais', slug: 'shopping',
      description: 'Achetez aux USA ou expédiez depuis la Guinée : profitez de nos adresses relais dédiées à New York et Conakry.',
      features: ['Adresses relais NY & Conakry', 'Réception & contrôle colis', 'Consolidation des achats', 'Expédition sécurisée'],
      prix: 'À partir de 10$/kg',
    },
  ];
}

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <h1>Nos Services Logistiques</h1>
          <p>Des solutions adaptées à chaque besoin, du colis individuel au transport professionnel à grande échelle.</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className={styles.page}>
        <div className="container">
          <ul className={styles.grid} role="list">
            {services.map((s) => (
              <li key={s.slug} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.icon} aria-hidden="true">{s.icon}</div>
                  <div>
                    <h2 className={styles.cardTitle}>{s.title}</h2>
                    <span className={styles.prix}>{s.prix}</span>
                  </div>
                </div>
                <p className={styles.desc}>{s.description}</p>
                <ul className={styles.features} aria-label="Caractéristiques">
                  {s.features.map((f) => (
                    <li key={f} className={styles.feature}>✓ {f}</li>
                  ))}
                </ul>
                <Link href="/devis" className={`btn btn-outline ${styles.cta}`}>
                  Demander un devis
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className="container">
          <h2>Besoin d'un service personnalisé ?</h2>
          <p>Notre équipe est là pour vous proposer une solution sur mesure.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/devis" className="btn btn-primary btn-lg">Obtenir un devis</Link>
            <Link href="/contact" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}>Nous contacter</Link>
          </div>
        </div>
      </section>
    </>
  );
}
