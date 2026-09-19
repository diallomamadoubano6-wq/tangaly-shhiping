import type { Metadata } from 'next';
import styles from './services.module.css';
import Link from 'next/link';
import { Plane, Ship, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nos Services — Fret Aérien & Fret Maritime USA ↔ Guinée',
  description: 'Découvrez nos 2 solutions logistiques expertes entre les USA et la Guinée : Fret Aérien express et Fret Maritime sécurisé dans les deux sens.',
};

async function getServices() {
  return [
    {
      Icon: Plane, title: 'Fret Aérien Express', slug: 'fret-aerien',
      description: 'La solution la plus rapide pour vos expéditions urgentes entre les USA et la Guinée (dans les deux sens). Délais garantis sous 48-72h.',
      features: ['Liaison rapide USA ↔ Guinée', 'Livraison express 48-72h', 'Suivi en temps réel', 'Assurance marchandise incluse'],
      prix: 'À partir de 8$/kg',
    },
    {
      Icon: Ship, title: 'Fret Maritime Sécurisé', slug: 'fret-maritime',
      description: 'La solution économique idéale pour les grands volumes, colis volumineux et conteneurs entre les États-Unis et le port de Conakry.',
      features: ['Départs réguliers dans les 2 sens', 'Groupage & Conteneurs entiers', 'Transit optimisé 15-21 jours', 'Prise en charge douanière'],
      prix: 'À partir de 350$/m³',
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
          <p>Deux solutions expertes adaptées à vos besoins : Fret Aérien rapide et Fret Maritime économique entre les États-Unis et la Guinée.</p>
        </div>
      </section>

      {/* Services Grid */}
      <section className={styles.page}>
        <div className="container">
          <ul className={styles.grid} role="list">
            {services.map((s) => {
              const IconComponent = s.Icon;
              return (
                <li key={s.slug} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.icon} aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <IconComponent size={28} className="text-primary" />
                    </div>
                    <div>
                      <h2 className={styles.cardTitle}>{s.title}</h2>
                      <span className={styles.prix}>{s.prix}</span>
                    </div>
                  </div>
                  <p className={styles.desc}>{s.description}</p>
                  <ul className={styles.features} aria-label="Caractéristiques">
                    {s.features.map((f) => (
                      <li key={f} className={styles.feature} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={16} className="text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/devis" className={`btn btn-outline ${styles.cta}`}>
                    Demander un devis
                  </Link>
                </li>
              );
            })}
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
