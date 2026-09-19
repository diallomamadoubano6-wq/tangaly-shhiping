import type { Metadata } from 'next';
import Link from 'next/link';
import { Send, Phone, MessageSquare, Mail, Clock } from 'lucide-react';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe TANGALY pour toute question sur vos expéditions, tarifs ou services logistiques USA ↔ Guinée.',
};

async function getContactInfo() {
  // À connecter à l'API : fetch(`${process.env.API_URL}/api/cms/settings?keys=contact`)
  return {
    telephone: '+1 (555) 000-0000',
    email: 'contact@tangaly.com',
    whatsapp: '+1 (555) 000-0000',
    adresses: [
      { pays: 'États-Unis', adresse: '123 Atlantic Ave, Brooklyn, New York, NY 11201' },
      { pays: 'Guinée', adresse: 'Avenue de la République, Conakry, Guinée' },
    ],
    horaires: 'Lundi – Samedi : 8h00 – 20h00 (Heure de New York)',
  };
}

export default async function ContactPage() {
  const info = await getContactInfo();

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <h1>Contactez-nous</h1>
          <p>Notre équipe bilingue est disponible pour répondre à toutes vos questions.</p>
        </div>
      </section>

      <section className={styles.page}>
        <div className="container">
          <div className={styles.layout}>
            {/* Formulaire de contact */}
            <div className={styles.formWrap}>
              <h2 className={styles.formTitle}>Envoyer un message</h2>
              <form className={styles.form} action="#" method="post">
                <div className={styles.row}>
                  <div className="form-group">
                    <label htmlFor="c-nom" className="form-label">Nom complet *</label>
                    <input id="c-nom" name="nom" type="text" className="form-input" required placeholder="Votre nom" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="c-email" className="form-label">Email *</label>
                    <input id="c-email" name="email" type="email" className="form-input" required placeholder="votre@email.com" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="c-sujet" className="form-label">Sujet *</label>
                  <select id="c-sujet" name="sujet" className="form-select" required>
                    <option value="">-- Sélectionner un sujet --</option>
                    <option>Renseignement sur un service</option>
                    <option>Suivi d'expédition</option>
                    <option>Demande de devis</option>
                    <option>Réclamation</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="c-message" className="form-label">Message *</label>
                  <textarea id="c-message" name="message" className="form-textarea" required rows={6} placeholder="Décrivez votre demande..." />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Send size={18} />
                  <span>Envoyer le message</span>
                </button>
              </form>
            </div>

            {/* Infos contact */}
            <aside className={styles.infoPanel}>
              <h2 className={styles.infoTitle}>Nos coordonnées</h2>

              <ul className={styles.contactList}>
                <li className={styles.contactItem}>
                  <span className={styles.contactIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={20} />
                  </span>
                  <div>
                    <strong>Téléphone</strong>
                    <a href={`tel:${info.telephone}`}>{info.telephone}</a>
                  </div>
                </li>
                <li className={styles.contactItem}>
                  <span className={styles.contactIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={20} />
                  </span>
                  <div>
                    <strong>WhatsApp</strong>
                    <a href={`https://wa.me/${info.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">{info.whatsapp}</a>
                  </div>
                </li>
                <li className={styles.contactItem}>
                  <span className={styles.contactIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={20} />
                  </span>
                  <div>
                    <strong>Email</strong>
                    <a href={`mailto:${info.email}`}>{info.email}</a>
                  </div>
                </li>
                <li className={styles.contactItem}>
                  <span className={styles.contactIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} />
                  </span>
                  <div>
                    <strong>Horaires</strong>
                    <p>{info.horaires}</p>
                  </div>
                </li>
              </ul>

              <div className={styles.divider} />

              <h3 className={styles.adresseTitle}>Nos bureaux</h3>
              {info.adresses.map((a) => (
                <div key={a.pays} className={styles.adresseCard}>
                  <strong>{a.pays}</strong>
                  <p>{a.adresse}</p>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
