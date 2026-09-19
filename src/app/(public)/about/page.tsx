import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, Rocket, Globe, Lightbulb } from 'lucide-react';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'À propos de TANGALY',
  description: 'Découvrez l\'histoire, les valeurs et l\'équipe de TANGALY, votre partenaire logistique entre les États-Unis et la Guinée depuis 2018.',
};

async function getAboutData() {
  // À connecter à l'API : fetch(`${process.env.API_URL}/api/pages?slug=about`)
  return {
    fondation: '2018',
    histoire: 'TANGALY est née d\'un constat simple : les Guinéens de la diaspora et les entreprises échangeant entre les USA et la Guinée manquaient d\'un partenaire logistique fiable, transparent et réactif. Fondée à New York en 2018, TANGALY a grandi pour devenir la référence du transport bilatéral USA–Guinée.',
    mission: 'Connecter les continents par la logistique, avec intégrité et excellence.',
    valeurs: [
      { Icon: Users, titre: 'Confiance', description: 'Chaque engagement est tenu. Votre colis est traité comme le nôtre.' },
      { Icon: Rocket, titre: 'Rapidité', description: 'Délais optimisés grâce à nos partenariats aériens et maritimes privilégiés.' },
      { Icon: Globe, titre: 'Proximité', description: 'Deux bureaux, une seule famille. USA et Guinée, nous sommes chez vous.' },
      { Icon: Lightbulb, titre: 'Innovation', description: 'Suivi digital, notifications temps réel, CMS moderne. Nous investissons en technologie.' },
    ],
    chiffres: [
      { value: '2018', label: 'Année de fondation' },
      { value: '10K+', label: 'Colis livrés' },
      { value: '98%', label: 'Satisfaction client' },
      { value: '2', label: 'Bureaux (NYC & Conakry)' },
    ],
    equipe: [
      { nom: 'Mamadou Bah', role: 'CEO & Fondateur', flag: '🇬🇳🇺🇸' },
      { nom: 'Aïssatou Diallo', role: 'Directrice Logistique', flag: '🇬🇳' },
      { nom: 'James Williams', role: 'Responsable USA', flag: '🇺🇸' },
      { nom: 'Fatoumata Camara', role: 'Relation Client', flag: '🇬🇳' },
    ],
  };
}

export default async function AboutPage() {
  const data = await getAboutData();

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroTag}>Fondée en {data.fondation}</div>
          <h1>À propos de TANGALY</h1>
          <p className={styles.mission}>« {data.mission} »</p>
        </div>
      </section>

      {/* Histoire */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.histoireLayout}>
            <div>
              <h2>Notre histoire</h2>
              <p className={styles.lead}>{data.histoire}</p>
              <Link href="/contact" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                Contactez-nous
              </Link>
            </div>
            <div className={styles.statsGrid}>
              {data.chiffres.map((c) => (
                <div key={c.label} className={styles.statBox}>
                  <span className={styles.statVal}>{c.value}</span>
                  <span className={styles.statLbl}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>Nos valeurs</h2>
            <p>Les principes qui guident chacune de nos actions au quotidien.</p>
          </div>
          <ul className={styles.valeursGrid} role="list">
            {data.valeurs.map((v) => {
              const IconComponent = v.Icon;
              return (
                <li key={v.titre} className={styles.valeurCard}>
                  <span className={styles.valeurIcon} aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComponent size={28} className="text-primary" />
                  </span>
                  <h3>{v.titre}</h3>
                  <p>{v.description}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Équipe */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>Notre équipe</h2>
            <p>Des professionnels dévoués, présents à chaque étape de votre expédition.</p>
          </div>
          <ul className={styles.equipeGrid} role="list">
            {data.equipe.map((m) => (
              <li key={m.nom} className={styles.membreCard}>
                <div className={styles.avatar} aria-hidden="true">{m.flag}</div>
                <h3 className={styles.membreNom}>{m.nom}</h3>
                <p className={styles.membreRole}>{m.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
