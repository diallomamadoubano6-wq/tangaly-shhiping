import type { Metadata } from 'next';
import Link from 'next/link';
import { FileCheck, Plane, Ship, AlertCircle, DollarSign, PackageCheck, ShieldAlert, PhoneCall } from 'lucide-react';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente (CGV) | TANGALY Shipping & Logistics',
  description: 'Conditions générales de vente et de transport régissant les expéditions de fret aérien et maritime entre les USA et la Guinée avec TANGALY Shipping.',
};

export default function CGVPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.badge}>
            <FileCheck size={14} /> Contrat de Transport &amp; Conditions Générales
          </div>
          <h1 className={styles.heroTitle}>Conditions Générales de Vente (CGV)</h1>
          <p className={styles.heroSubtitle}>
            Règles et engagements mutuels régissant les opérations d&apos;expédition aérienne et maritime entre les États-Unis et la Guinée.
          </p>
          <div className={styles.heroMeta}>
            <span>Dernière révision : 30 Octobre 2026</span>
            <span>•</span>
            <span>Applicable à tous les envois</span>
          </div>
        </div>
      </section>

      <main className={styles.contentWrapper}>
        <div className={styles.card}>

          {/* Article 1 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <FileCheck size={20} />
              </div>
              <h2 className={styles.sectionTitle}>Article 1 : Objet &amp; Champ d&apos;Application</h2>
            </div>
            <p className={styles.paragraph}>
              Les présentes Conditions Générales de Vente (CGV) s&apos;appliquent sans restriction ni réserve à l&apos;ensemble des prestations d&apos;expédition, de transit, d&apos;entreposage et de dédouanement fournies par <strong>TANGALY Shipping &amp; Logistics</strong> à toute personne physique ou morale (ci-après &quot;l&apos;Expéditeur&quot; ou &quot;le Client&quot;).
            </p>
            <p className={styles.paragraph}>
              Toute remise de colis ou validation d&apos;ordre d&apos;expédition emporte adhésion pleine et entière aux présentes conditions, nonobstant toute stipulation contraire émise par le Client.
            </p>
          </section>

          {/* Article 2 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Plane size={20} />
              </div>
              <h2 className={styles.sectionTitle}>Article 2 : Prestations de Transport (Aérien &amp; Maritime)</h2>
            </div>
            <p className={styles.paragraph}>
              TANGALY propose deux modes d&apos;acheminement international :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Fret Aérien Express (Air Freight) :</strong> Envois réguliers par avion au départ de New York vers Conakry. Délais indicatifs : 7 à 10 jours ouvrés après départ du vol. Facturation au poids réel (kg) ou volumétrique selon les normes IATA.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Fret Maritime (Ocean Freight) :</strong> Expéditions par conteneurs maritimes pour marchandises volumineuses, cartons lourds et véhicules. Délais indicatifs : 30 à 45 jours après le départ du navire. Facturation au mètre cube (m³) ou au forfait carton standard.</span>
              </li>
            </ul>
            <p className={styles.paragraph} style={{ fontSize: '0.875rem', color: '#64748b' }}>
              <em>Note : Les délais indiqués sont indicatifs et peuvent être assujettis aux contrôles douaniers portuaires ou aéroportuaires et aux conditions météorologiques.</em>
            </p>
          </section>

          {/* Article 3 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <DollarSign size={20} />
              </div>
              <h2 className={styles.sectionTitle}>Article 3 : Tarifs, Facturation &amp; Modalités de Paiement</h2>
            </div>
            <p className={styles.paragraph}>
              Les tarifs sont établis en <strong>Dollars US ($ USD)</strong> et peuvent être réglés en devises locales (notamment en Francs Guinéens - GNF) sur la base du cours appliqué en agence au moment du règlement :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Acompte et paiement complet :</strong> Un acompte peut être exigé à l&apos;enregistrement du colis aux USA. Le solde intégral doit être payé avant la mise à disposition ou remise définitive du colis au destinataire.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Moyens de paiement acceptés :</strong> Espèces (CASH en USD ou GNF), Zelle, Orange Money, virement bancaire. Un reçu officiel numérique ou imprimé avec QR code de validation est délivré pour chaque versement.</span>
              </li>
            </ul>
          </section>

          {/* Article 4 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <ShieldAlert size={20} />
              </div>
              <h2 className={styles.sectionTitle}>Article 4 : Marchandises Prohibées &amp; Dangereuses</h2>
            </div>
            <div className={`${styles.infoBox} ${styles.infoBoxWarning}`}>
              <div className={styles.infoBoxTitle}>
                <AlertCircle size={16} color="#d97706" /> Déclaration sous serment de l&apos;expéditeur
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e' }}>
                Il est strictement interdit d&apos;expédier des armes, munitions, explosifs, drogues, stupéfiants, matières inflammables, contrefaçons, devises en espèces non déclarées ou tout article prohibé par la législation américaine ou guinéenne.
              </p>
            </div>
            <p className={styles.paragraph}>
              En cas de fausse déclaration, le Client assume l&apos;entière responsabilité juridique, pénale et financière des poursuites douanières ou confiscations.
            </p>
          </section>

          {/* Article 5 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <PackageCheck size={20} />
              </div>
              <h2 className={styles.sectionTitle}>Article 5 : Réception &amp; Retrait des Colis</h2>
            </div>
            <p className={styles.paragraph}>
              Dès l&apos;arrivée du colis à Conakry ou dans les agences régionales (Labé, Kindia, Mamou, etc.), le destinataire est avisé par SMS, appel ou WhatsApp.
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Justification d&apos;identité :</strong> Le retrait nécessite obligatoirement la présentation d&apos;une pièce d&apos;identité valide au nom du destinataire indiqué sur le bordereau.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Délai de garde gratuit :</strong> Les colis sont gardés gratuitement en agence pendant une durée de 15 jours calendaires. Au-delà, des frais de magasinage journaliers peuvent être facturés.</span>
              </li>
            </ul>
          </section>

          {/* Article 6 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <PhoneCall size={20} />
              </div>
              <h2 className={styles.sectionTitle}>Article 6 : Réclamations &amp; Litiges</h2>
            </div>
            <p className={styles.paragraph}>
              Toute avarie apparente ou anomalie sur le colis doit impérativement faire l&apos;objet de réserves précises et motivées inscrites sur le bordereau de livraison au moment du retrait en présence de l&apos;agent TANGALY. Les réclamations doivent être transmises par écrit sous 48 heures ouvrées à notre service client : <strong>contact@tangalylogistics.com</strong>.
            </p>
          </section>

        </div>
      </main>
    </>
  );
}
