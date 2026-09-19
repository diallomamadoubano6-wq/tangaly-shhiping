'use client';

import { useState } from 'react';
import { submitQuote } from '@/actions/public';
import { CheckCircle2, Send, Zap, BadgePercent, PhoneCall } from 'lucide-react';
import styles from './devis.module.css';

const SERVICES = ['Fret Aérien', 'Fret Maritime'];
const ZONES = ['USA → Guinée', 'Guinée → USA'];

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
      const origine = zone === 'Guinée → USA' ? 'Guinée' : 'USA';
      const destination = zone === 'Guinée → USA' ? 'USA' : 'Guinée';

      const res = await submitQuote({
        client_nom: fd.get('nom') as string,
        client_email: fd.get('email') as string,
        client_tel: (fd.get('telephone') as string) || '',
        service: fd.get('service') as string,
        origine,
        destination,
        poids_estime: (fd.get('poids') as string) || '',
        message: fd.get('description') as string,
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setError('Une erreur est survenue.');
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
            <span className="state-icon" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              <CheckCircle2 size={48} className="text-emerald-500" />
            </span>
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
                <label htmlFor="zone" className="form-label">Trajet (USA ↔ Guinée) *</label>
                <select id="zone" name="zone" className="form-select" required>
                  <option value="">-- Choisir le trajet --</option>
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

            <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <span className="spinner" aria-hidden="true" /> : <Send size={18} />}
              <span>{loading ? 'Envoi en cours...' : 'Envoyer ma demande'}</span>
            </button>
          </form>

          {/* Sidebar info */}
          <aside className={styles.sidebar} aria-label="Informations complémentaires">
            <div className={styles.infoCard}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={18} className="text-amber-500" />
                <span>Réponse rapide</span>
              </h3>
              <p>Notre équipe répond à chaque demande sous <strong>24 heures ouvrées</strong>.</p>
            </div>
            <div className={styles.infoCard}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BadgePercent size={18} className="text-emerald-500" />
                <span>Devis sans engagement</span>
              </h3>
              <p>Votre demande de devis est totalement <strong>gratuite et sans engagement</strong>.</p>
            </div>
            <div className={styles.infoCard}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PhoneCall size={18} className="text-blue-500" />
                <span>Besoin d'aide ?</span>
              </h3>
              <p>Notre équipe est disponible par téléphone au <strong>+1 (555) 000-0000</strong> ou par WhatsApp.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
