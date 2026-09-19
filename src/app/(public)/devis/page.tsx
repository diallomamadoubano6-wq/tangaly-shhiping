'use client';

import { useState } from 'react';
import { submitQuote } from '@/actions/public';
import styles from './devis.module.css';

const SERVICES = ['Fret Aérien', 'Fret Maritime'];
const ZONES = ['USA → Guinée', 'Guinée → USA', 'USA → Afrique de l\'Ouest', 'Autre'];

export default function DevisPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const form = e.currentTarget;
    const fd = new FormData(form);
    
    try {
      const zone = (fd.get('zone') as string) || 'USA → Guinée';
      let origine = 'USA';
      let destination = 'Guinée';
      if (zone === 'Guinée → USA') {
        origine = 'Guinée';
        destination = 'USA';
      } else if (zone.includes('→')) {
        const parts = zone.split('→');
        origine = parts[0]?.trim() || 'USA';
        destination = parts[1]?.trim() || 'Guinée';
      }

      const data = {
        client_nom:    fd.get('nom') as string,
        client_email:  fd.get('email') as string,
        client_tel:    fd.get('telephone') as string,
        service:       fd.get('service') as string,
        origine,
        destination,
        poids_estime:  fd.get('poids') as string,
        message:       fd.get('description') as string,
      };
      
      const res = await submitQuote(data);

      if (!res.success) {
        setError(res.message || 'Une erreur est survenue. Veuillez réessayer.');
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className={styles.page}>
        <div className="container">
          <div className={`state-container ${styles.successState}`}>
            <span className="state-icon">✅</span>
            <h2 className="state-title">Demande envoyée !</h2>
            <p>Notre équipe a bien reçu votre demande de devis. Vous serez contacté sous 24 heures ouvrées.</p>
            <button className="btn btn-outline" onClick={() => setSubmitted(false)}>
              Faire une nouvelle demande
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <h1>Demande de devis gratuit</h1>
          <p>Remplissez ce formulaire et recevez une offre personnalisée sous 24h.</p>
        </div>

        <div className={styles.layout}>
          {/* Formulaire */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <h2 className={styles.formSection}>Vos coordonnées</h2>

            <div className={styles.row}>
              <div className="form-group">
                <label htmlFor="nom" className="form-label">Nom complet *</label>
                <input id="nom" name="nom" type="text" className="form-input" placeholder="Jean Dupont" required />
              </div>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email *</label>
                <input id="email" name="email" type="email" className="form-input" placeholder="jean@exemple.com" required />
              </div>
            </div>

            <div className={styles.row}>
              <div className="form-group">
                <label htmlFor="telephone" className="form-label">Téléphone</label>
                <input id="telephone" name="telephone" type="tel" className="form-input" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="form-group">
                <label htmlFor="entreprise" className="form-label">Entreprise (optionnel)</label>
                <input id="entreprise" name="entreprise" type="text" className="form-input" placeholder="Nom de votre société" />
              </div>
            </div>

            <h2 className={styles.formSection}>Détails de l'expédition</h2>

            <div className={styles.row}>
              <div className="form-group">
                <label htmlFor="service" className="form-label">Type de service *</label>
                <select id="service" name="service" className="form-select" required>
                  <option value="">-- Choisir un service --</option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="zone" className="form-label">Zone *</label>
                <select id="zone" name="zone" className="form-select" required>
                  <option value="">-- Choisir une zone --</option>
                  {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className="form-group">
                <label htmlFor="poids" className="form-label">Poids estimé (kg)</label>
                <input id="poids" name="poids" type="number" min="0" step="0.1" className="form-input" placeholder="Ex: 25" />
              </div>
              <div className="form-group">
                <label htmlFor="volume" className="form-label">Volume estimé (m³)</label>
                <input id="volume" name="volume" type="number" min="0" step="0.01" className="form-input" placeholder="Ex: 0.5" />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description de la marchandise *</label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                placeholder="Décrivez le contenu de votre expédition, les dimensions, la valeur approximative..."
                required
                rows={5}
              />
              <span className="form-hint">Minimum 20 caractères. Plus vous êtes précis, plus notre offre sera adaptée.</span>
            </div>

            <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
              {loading ? <span className="spinner" aria-hidden="true" /> : null}
              {loading ? 'Envoi en cours...' : '📨 Envoyer ma demande'}
            </button>
          </form>

          {/* Sidebar info */}
          <aside className={styles.sidebar} aria-label="Informations complémentaires">
            <div className={styles.infoCard}>
              <h3>⚡ Réponse rapide</h3>
              <p>Notre équipe répond à chaque demande sous <strong>24 heures ouvrées</strong>.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>💰 Devis sans engagement</h3>
              <p>Votre demande de devis est totalement <strong>gratuite et sans engagement</strong>.</p>
            </div>
            <div className={styles.infoCard}>
              <h3>📞 Besoin d'aide ?</h3>
              <p>Notre équipe est disponible par téléphone au <strong>+1 (555) 000-0000</strong> ou par WhatsApp.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
