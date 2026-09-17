'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCmsSettings, updateCmsSetting } from '@/actions/cms';
import { getServices } from '@/actions/logistics';
import { useToast } from '@/components/ui/ToastProvider';
import styles from './cms.module.css';

interface CmsStat { value: string; label: string; }
interface CmsHero { headline: string; subheadline: string; }

export default function CMSHomepage() {
  const { addToast } = useToast();
  const [hero, setHero] = useState<CmsHero>({ headline: '', subheadline: '' });
  const [stats, setStats] = useState<CmsStat[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [config, servicesData] = await Promise.all([
        getCmsSettings(),
        getServices()
      ]);

      if (config['hero']) setHero(typeof config['hero'] === 'string' ? JSON.parse(config['hero']) : config['hero']);
      if (config['stats']) setStats(typeof config['stats'] === 'string' ? JSON.parse(config['stats']) : config['stats']);
      
      setServices(servicesData || []);
    } catch (e) {
      addToast('error', 'Erreur de chargement du CMS');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveHero = async () => {
    setSaving(true);
    try {
      await updateCmsSetting('hero', JSON.stringify(hero), 'Bannière principale');
      addToast('success', "Hero sauvegardé ! La page d'accueil est mise à jour.");
    } catch (e) {
      addToast('error', 'Erreur lors de la sauvegarde du Hero');
    }
    setSaving(false);
  };

  const saveStats = async () => {
    setSaving(true);
    try {
      await updateCmsSetting('stats', JSON.stringify(stats), 'Statistiques clés');
      addToast('success', 'Statistiques sauvegardées !');
    } catch (e) {
      addToast('error', 'Erreur lors de la sauvegarde des stats');
    }
    setSaving(false);
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

  if (loading) return <div>Chargement du CMS...</div>;

  return (
    <div className={styles.cmsContainer}>
      <div className={styles.header}>
        <h2>Éditeur Page d&apos;Accueil</h2>
        <span style={{ fontSize: '0.8rem', background: '#f0fff4', padding: '4px 12px', borderRadius: '999px', color: '#16a34a' }}>
          🔗 Connecté à la Base de Données
        </span>
      </div>

      {/* Section Hero */}
      <div className={styles.sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0 }}>Section Hero (Bannière principale)</h3>
          <button className="btn btn-primary btn-sm" onClick={saveHero} disabled={saving}>Sauvegarder</button>
        </div>
        <div className="form-group">
          <label className="form-label">Titre principal</label>
          <input type="text" className="form-input" value={hero.headline} onChange={e => setHero(p => ({ ...p, headline: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Sous-titre</label>
          <textarea className="form-textarea" value={hero.subheadline} onChange={e => setHero(p => ({ ...p, subheadline: e.target.value }))} rows={3} />
        </div>
      </div>

      {/* Statistiques */}
      <div className={styles.sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0 }}>Statistiques clés</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm" onClick={addStat}>+ Ajouter</button>
            <button className="btn btn-primary btn-sm" onClick={saveStats} disabled={saving}>Sauvegarder</button>
          </div>
        </div>
        <div className={styles.grid2}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.statBox} style={{ position: 'relative' }}>
              <button 
                onClick={() => removeStat(i)} 
                style={{ position: 'absolute', top: 5, right: 5, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
              >
                ✕
              </button>
              <div className="form-group">
                <label className="form-label">Valeur (ex: 10k+)</label>
                <input type="text" className="form-input" value={stat.value} onChange={e => handleStatChange(i, 'value', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Label</label>
                <input type="text" className="form-input" value={stat.label} onChange={e => handleStatChange(i, 'label', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className={styles.sectionCard}>
        <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ margin: 0 }}>Services</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Pour modifier les services (images, titres, descriptions), allez dans <a href="/admin/services" style={{ color: 'var(--color-primary)' }}>Logistique → Services</a>
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
                  <span style={{ color: '#94a3b8' }}>Pas d'image</span>
                )}
              </div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{s.titre}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}