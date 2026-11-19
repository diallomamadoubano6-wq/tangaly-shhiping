'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getCmsSettings, 
  updateCmsSetting, 
  getPublicContactInfo, 
  updateContactInfo
} from '@/actions/cms';
import { SiteContactInfo, DEFAULT_CONTACT_INFO } from '@/lib/contact';
import { getServices } from '@/actions/logistics';
import { useToast } from '@/components/ui/ToastProvider';
import styles from './cms.module.css';
import { 
  Globe, Phone, Mail, MapPin, Clock, MessageSquare, 
  Share2, Save, Sparkles, CheckCircle2, Building, RefreshCw 
} from 'lucide-react';

interface CmsStat { value: string; label: string; }
interface CmsHero { headline: string; subheadline: string; }

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export default function CMSHomepage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'contact' | 'hero' | 'stats' | 'services'>('contact');
  
  // Coordonnées
  const [contact, setContact] = useState<SiteContactInfo>(DEFAULT_CONTACT_INFO);
  const [savingContact, setSavingContact] = useState(false);

  // Hero & Stats
  const [hero, setHero] = useState<CmsHero>({ headline: '', subheadline: '' });
  const [stats, setStats] = useState<CmsStat[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [savingStats, setSavingStats] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [config, contactData, servicesData] = await Promise.all([
        getCmsSettings().catch(() => ({})),
        getPublicContactInfo().catch(() => DEFAULT_CONTACT_INFO),
        getServices().catch(() => [])
      ]);

      if (contactData) {
        setContact(contactData);
      }

      const defaultHero = {
        headline: "Expédiez vos colis entre les USA et la Guinée en toute sérénité",
        subheadline: "La solution logistique de confiance pour tous vos envois : depuis les États-Unis vers la Guinée et depuis la Guinée vers les États-Unis."
      };
      const defaultStats = [
        { value: '10,000+', label: 'Colis livrés avec succès' },
        { value: '99.8%', label: 'Taux de satisfaction client' },
        { value: '2', label: 'Hubs logistiques (NY & Conakry)' },
        { value: '48h', label: 'Délai moyen traitement express' },
      ];

      setHero(safeJsonParse(config?.['hero'], defaultHero));
      setStats(safeJsonParse(config?.['stats'], defaultStats));
      setServices(servicesData || []);
    } catch (e) {
      console.error('Erreur chargement CMS:', e);
      addToast('error', 'Erreur de chargement des paramètres du site');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const res = await updateContactInfo(contact);
      if (res.success) {
        addToast('success', 'Coordonnées du site mises à jour avec succès !');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      addToast('error', 'Impossible de sauvegarder les coordonnées', msg);
    }
    setSavingContact(false);
  };

  const saveHero = async () => {
    setSavingHero(true);
    try {
      await updateCmsSetting('hero', JSON.stringify(hero), 'Bannière principale');
      addToast('success', "Hero sauvegardé ! La page d'accueil est actualisée.");
    } catch {
      addToast('error', 'Erreur lors de la sauvegarde du Hero');
    }
    setSavingHero(false);
  };

  const saveStats = async () => {
    setSavingStats(true);
    try {
      await updateCmsSetting('stats', JSON.stringify(stats), 'Statistiques clés');
      addToast('success', 'Statistiques sauvegardées avec succès !');
    } catch {
      addToast('error', 'Erreur lors de la sauvegarde des stats');
    }
    setSavingStats(false);
  };

  const handleStatChange = (i: number, key: keyof CmsStat, val: string) => {
    const updated = [...stats];
    updated[i] = { ...updated[i], [key]: val };
    setStats(updated);
  };

  const addStat = () => {
    setStats([...stats, { value: '', label: '' }]);
  };

  const removeStat = (index: number) => {
    const updated = [...stats];
    updated.splice(index, 1);
    setStats(updated);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: '#64748b' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Chargement des données du site...</span>
      </div>
    );
  }

  return (
    <div className={styles.cmsContainer}>
      <div className={styles.header}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Personnalisation du Site & Coordonnées
          </h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
            Gérez facilement les coordonnées de contact (Gmail/email, téléphones, WhatsApp), les adresses et le contenu de la vitrine.
          </p>
        </div>
        <span style={{ fontSize: '0.85rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
          <CheckCircle2 size={16} /> Enregistrement direct en base
        </span>
      </div>

      {/* Onglets de navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #e2e8f0', paddingBottom: 2, overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'contact' ? '3px solid #2563eb' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'contact' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'contact' ? 600 : 500,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Phone size={16} /> Coordonnées &amp; Contact
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'hero' ? '3px solid #2563eb' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'hero' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'hero' ? 600 : 500,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Globe size={16} /> Bannière Accueil (Hero)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'stats' ? '3px solid #2563eb' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'stats' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'stats' ? 600 : 500,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Sparkles size={16} /> Statistiques
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'services' ? '3px solid #2563eb' : '3px solid transparent',
            background: 'none',
            color: activeTab === 'services' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'services' ? 600 : 500,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Building size={16} /> Services
        </button>
      </div>

      {/* ONGLET 1 : COORDONNÉES */}
      {activeTab === 'contact' && (
        <form onSubmit={handleSaveContact} className={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Coordonnées Officielles de l&apos;Entreprise</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Ces données s&apos;affichent dans le pied de page (Footer), sur la page Contact et pour les agents IA.
              </p>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={savingContact}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8 }}
            >
              <Save size={16} />
              {savingContact ? 'Enregistrement...' : 'Enregistrer les coordonnées'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Email / Gmail */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Mail size={16} color="#2563eb" /> Email de Contact / Gmail Officiel
              </label>
              <input 
                type="email" 
                className="form-input" 
                value={contact.email} 
                onChange={e => setContact(p => ({ ...p, email: e.target.value }))}
                placeholder="ex: contact@tangalyshipping.com ou tangaly@gmail.com"
                required
              />
              <span style={{ fontSize: 12, color: '#64748b' }}>Reçoit les messages envoyés depuis le formulaire de contact.</span>
            </div>

            {/* WhatsApp */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <MessageSquare size={16} color="#16a34a" /> Numéro WhatsApp Principal
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={contact.whatsapp} 
                onChange={e => setContact(p => ({ ...p, whatsapp: e.target.value }))}
                placeholder="+1 (646) 382-0065"
                required
              />
              <span style={{ fontSize: 12, color: '#64748b' }}>Utilisé par le bouton flottant WhatsApp et le pied de page.</span>
            </div>

            {/* Téléphone USA */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Phone size={16} color="#dc2626" /> Téléphone Agence USA (New York)
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={contact.phoneUSA} 
                onChange={e => setContact(p => ({ ...p, phoneUSA: e.target.value }))}
                placeholder="+1 (646) 382-0065"
                required
              />
            </div>

            {/* Téléphone Guinée */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Phone size={16} color="#d97706" /> Téléphone Agence Guinée (Conakry)
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={contact.phoneGN} 
                onChange={e => setContact(p => ({ ...p, phoneGN: e.target.value }))}
                placeholder="+224 626 98 52 54"
                required
              />
            </div>

            {/* Adresse USA */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <MapPin size={16} color="#dc2626" /> Adresse Hub USA (New York)
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={contact.addressUSA} 
                onChange={e => setContact(p => ({ ...p, addressUSA: e.target.value }))}
                placeholder="3429 3rd Ave, Bronx, NY 10456"
                required
              />
            </div>

            {/* Adresse Guinée */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <MapPin size={16} color="#d97706" /> Adresse Hub Guinée (Conakry)
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={contact.addressGN} 
                onChange={e => setContact(p => ({ ...p, addressGN: e.target.value }))}
                placeholder="Cité Enco 5, Conakry, Guinée"
                required
              />
            </div>

            {/* Horaires d'ouverture */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Clock size={16} color="#475569" /> Horaires d&apos;ouverture
              </label>
              <input 
                type="text" 
                className="form-input" 
                value={contact.horaires} 
                onChange={e => setContact(p => ({ ...p, horaires: e.target.value }))}
                placeholder="Lundi – Samedi : 8h00 – 20h00 (Heure locale)"
              />
            </div>

            {/* Réseaux sociaux */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Share2 size={16} color="#1877f2" /> Lien Page Facebook
              </label>
              <input 
                type="url" 
                className="form-input" 
                value={contact.facebook || ''} 
                onChange={e => setContact(p => ({ ...p, facebook: e.target.value }))}
                placeholder="https://www.facebook.com/tangalyshipping"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Share2 size={16} color="#e1306c" /> Lien Page Instagram
              </label>
              <input 
                type="url" 
                className="form-input" 
                value={contact.instagram || ''} 
                onChange={e => setContact(p => ({ ...p, instagram: e.target.value }))}
                placeholder="https://www.instagram.com/tangalyshipping"
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={savingContact}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, fontWeight: 600 }}
            >
              <Save size={16} />
              {savingContact ? 'Enregistrement...' : 'Enregistrer les coordonnées'}
            </button>
          </div>
        </form>
      )}

      {/* ONGLET 2 : SECTION HERO */}
      {activeTab === 'hero' && (
        <div className={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Section Hero (Bannière principale)</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Textes d&apos;accroche affichés au tout début de la page d&apos;accueil.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={saveHero} disabled={savingHero}>
              {savingHero ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Titre principal (Headline)</label>
            <input type="text" className="form-input" value={hero.headline} onChange={e => setHero(p => ({ ...p, headline: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Sous-titre explicatif</label>
            <textarea className="form-textarea" value={hero.subheadline} onChange={e => setHero(p => ({ ...p, subheadline: e.target.value }))} rows={3} />
          </div>
        </div>
      )}

      {/* ONGLET 3 : STATISTIQUES */}
      {activeTab === 'stats' && (
        <div className={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <h3 style={{ margin: 0 }}>Statistiques Clés</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                Chiffres de confiance affichés sur la page d&apos;accueil.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline btn-sm" onClick={addStat}>+ Ajouter un chiffre</button>
              <button className="btn btn-primary btn-sm" onClick={saveStats} disabled={savingStats}>
                {savingStats ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
          <div className={styles.grid2}>
            {stats.map((stat, i) => (
              <div key={i} className={styles.statBox} style={{ position: 'relative' }}>
                <button 
                  onClick={() => removeStat(i)} 
                  style={{ position: 'absolute', top: 8, right: 8, background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                  title="Supprimer cette statistique"
                >
                  ✕
                </button>
                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="form-label">Valeur (ex: 10,000+)</label>
                  <input type="text" className="form-input" value={stat.value} onChange={e => handleStatChange(i, 'value', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Libellé (Label)</label>
                  <input type="text" className="form-input" value={stat.label} onChange={e => handleStatChange(i, 'label', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ONGLET 4 : SERVICES */}
      {activeTab === 'services' && (
        <div className={styles.sectionCard}>
          <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0 }}>Aperçu des Services</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Pour modifier les tarifs ou descriptions complètes de chaque service, accédez à la gestion dédiée.
            </p>
          </div>
          <div className={styles.grid2}>
            {services.map(s => (
              <div key={s.id} className={styles.serviceBox} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <div className={styles.imagePreview} style={{ height: '120px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt={s.titre} style={{ maxHeight: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Pas d&apos;image</span>
                  )}
                </div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{s.titre}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}