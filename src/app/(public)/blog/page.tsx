import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './blog.module.css';

export const metadata: Metadata = {
  title: 'Actualités & Blog',
  description: 'Restez informé des dernières nouvelles de TANGALY : actualités logistiques, conseils d\'expédition et mises à jour de services.',
};

async function getArticles() {
  // À connecter à l'API : fetch(`${process.env.API_URL}/api/articles?publie=true`)
  return [
    {
      slug: 'delais-fret-aerien-2026',
      titre: 'Les délais du fret aérien USA–Guinée en 2026',
      extrait: 'Grâce à nos nouveaux partenariats avec les compagnies aériennes, nous réduisons nos délais à 48h pour les expéditions express entre New York et Conakry.',
      image: null,
      date: '2026-09-01',
      categorie: 'Logistique',
    },
    {
      slug: 'guide-colis-douane-guinee',
      titre: 'Guide complet : passer la douane guinéenne sans stress',
      extrait: 'Tout ce que vous devez savoir sur les règles douanières guinéennes : documents requis, taxes, articles interdits et conseils pratiques.',
      image: null,
      date: '2026-08-20',
      categorie: 'Conseils',
    },
    {
      slug: 'nouveau-bureau-conakry',
      titre: 'TANGALY ouvre son nouveau bureau à Conakry',
      extrait: 'Pour mieux vous servir, TANGALY a inauguré un bureau plus grand et mieux équipé dans le quartier Kaloum à Conakry.',
      image: null,
      date: '2026-08-01',
      categorie: 'Entreprise',
    },
    {
      slug: 'comment-emballer-colis',
      titre: 'Comment bien emballer votre colis pour l\'international',
      extrait: 'Les bons gestes d\'emballage pour éviter les dommages lors du transport international. Matériaux recommandés et erreurs à éviter.',
      image: null,
      date: '2026-07-15',
      categorie: 'Conseils',
    },
    {
      slug: 'shopping-usa-livraison-guinee',
      titre: 'Acheter aux USA et se faire livrer en Guinée : le guide 2026',
      extrait: 'Utilisez l\'adresse américaine de TANGALY pour recevoir vos achats en ligne aux USA, puis faire livrer en Guinée à prix compétitif.',
      image: null,
      date: '2026-07-01',
      categorie: 'Services',
    },
    {
      slug: 'partenariats-compagnies-aeriennes',
      titre: 'TANGALY renforce ses partenariats avec Air France et Emirates',
      extrait: 'De nouveaux accords de fret avec Air France et Emirates permettent à TANGALY de proposer des fréquences et des tarifs encore plus compétitifs.',
      image: null,
      date: '2026-06-15',
      categorie: 'Entreprise',
    },
  ];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const CATEGORIES = ['Tous', 'Logistique', 'Conseils', 'Entreprise', 'Services'];

export default async function BlogPage() {
  const articles = await getArticles();

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <h1>Actualités & Blog</h1>
          <p>Conseils logistiques, actualités de l'entreprise et guides pratiques.</p>
        </div>
      </section>

      <section className={styles.page}>
        <div className="container">
          {/* Filtres catégories */}
          <nav className={styles.filters} aria-label="Filtrer par catégorie">
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`${styles.filterBtn} ${cat === 'Tous' ? styles.filterActive : ''}`}>
                {cat}
              </button>
            ))}
          </nav>

          {/* Grille articles */}
          <ul className={styles.grid} role="list">
            {articles.map((art, i) => (
              <li key={art.slug} className={`${styles.card} ${i === 0 ? styles.featured : ''}`}>
                <div className={styles.cardImg} aria-hidden="true">
                  <span className={styles.cardImgPlaceholder}>📰</span>
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.categorie}>{art.categorie}</span>
                  <h2 className={styles.cardTitle}>
                    <Link href={`/blog/${art.slug}`}>{art.titre}</Link>
                  </h2>
                  <p className={styles.cardExtrait}>{art.extrait}</p>
                  <div className={styles.cardFooter}>
                    <time className={styles.date} dateTime={art.date}>{formatDate(art.date)}</time>
                    <Link href={`/blog/${art.slug}`} className={styles.readMore}>Lire →</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
