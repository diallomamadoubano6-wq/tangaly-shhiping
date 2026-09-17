'use client';

import { useState, useEffect, useCallback } from 'react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { getTarifs, createTarif, updateTarif, deleteTarif } from '@/actions/logistics';
import styles from './tarifs.module.css';

type Tarif = {
  id: string;
  zone: string;
  service: string;
  prix_kg: number;
  prix_min: number;
  delai: string;
  devise: string;
  actif: boolean;
};

const SERVICES = ['Fret Aérien', 'Fret Maritime', 'Consolidation', 'Solution B2B'];
const ZONES = ['Conakry', 'Labé', 'Kindia', 'N\'Zérékoré', 'Kankan', 'Mamou', 'Dakar'];

export default function TarifsAdminPage() {
  const { addToast } = useToast();
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; tarif: Partial<Tarif> | null; isNew: boolean }>({ open: false, tarif: null, isNew: false });
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`;
  const getAuthHeader = () => ({ 'Authorization': 'Bearer fake-token-for-dev', 'Content-Type': 'application/json' });

  const fetchTarifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTarifs();
      setTarifs(data || []);
    } catch (e) {
      addToast('error', 'Erreur chargement tarifs');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { fetchTarifs(); }, [fetchTarifs]);

  const openCreate = () => setModal({ open: true, tarif: { zone: 'Conakry', service: 'Fret Aérien', prix_kg: 0, prix_min: 0, delai: '', devise: 'USD', actif: true }, isNew: true });
  const openEdit = (t: Tarif) => setModal({ open: true, tarif: { ...t }, isNew: false });

  const handleChange = (key: keyof Tarif, value: string | number | boolean) =>
    setModal(prev => prev.tarif ? { ...prev, tarif: { ...prev.tarif, [key]: value } } : prev);

  const saveTarif = async () => {
    if (!modal.tarif) return;
    setSaving(true);
    try {
      if (modal.isNew) {
        await createTarif(modal.tarif);
        addToast('success', 'Tarif ajouté !');
      } else {
        const { id, ...updates } = modal.tarif as Tarif;
        await updateTarif(id, updates);
        addToast('success', 'Tarif mis à jour !');
      }
      setModal({ open: false, tarif: null, isNew: false });
      fetchTarifs();
    } catch (e) {
      addToast('error', 'Erreur sauvegarde');
    }
    setSaving(false);
  };

  const handleDeleteTarif = async (id: string) => {
    if (!confirm('Supprimer ce tarif ?')) return;
    try {
      await deleteTarif(id);
      addToast('success', 'Tarif supprimé');
      fetchTarifs();
    } catch (e) {
      addToast('error', 'Erreur suppression');
    }
  };

  // Grouper par zone
  const grouped = tarifs.reduce<Record<string, Tarif[]>>((acc, t) => {
    if (!acc[t.zone]) acc[t.zone] = [];
    acc[t.zone].push(t);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Tarifs & Zones</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'var(--color-orange-light)', padding: '4px 12px', borderRadius: '999px' }}>
            🔗 Affiché sur /devis
          </span>
          <button className="btn btn-primary" onClick={openCreate}>+ Nouveau tarif</button>
        </div>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(grouped).map(([zone, zoneTarifs]) => (
            <div key={zone} className={styles.zoneCard}>
              <h3 className={styles.zoneTitle}>📍 {zone}</h3>
              <div className="table-container">
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Prix/kg</th>
                        <th>Minimum</th>
                        <th>Délai</th>
                        <th>Devise</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneTarifs.map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.service}</strong></td>
                          <td>{t.prix_kg} {t.devise}</td>
                          <td>{t.prix_min} {t.devise}</td>
                          <td>{t.delai}</td>
                          <td>{t.devise}</td>
                          <td>
                            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: t.actif ? '#f0fff4' : '#fff1f2', color: t.actif ? '#16a34a' : '#e11d48' }}>
                              {t.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEdit(t)}>Modifier</button>
                              <button className="btn btn-sm" style={{ background: '#fff1f2', color: '#e11d48', border: 'none' }} onClick={() => handleDeleteTarif(t.id)}>✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
          {tarifs.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Aucun tarif configuré.</p>}
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, tarif: null, isNew: false })} title={modal.isNew ? 'Nouveau Tarif' : 'Modifier le Tarif'}>
        {modal.tarif && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Zone / Destination</label>
                <select className="form-input" value={modal.tarif.zone || ''} onChange={e => handleChange('zone', e.target.value)}>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Service</label>
                <select className="form-input" value={modal.tarif.service || ''} onChange={e => handleChange('service', e.target.value)}>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prix par kg</label>
                <input type="number" step="0.01" className="form-input" value={modal.tarif.prix_kg || 0} onChange={e => handleChange('prix_kg', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Prix minimum</label>
                <input type="number" step="0.01" className="form-input" value={modal.tarif.prix_min || 0} onChange={e => handleChange('prix_min', parseFloat(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Délai estimé</label>
                <input type="text" className="form-input" value={modal.tarif.delai || ''} onChange={e => handleChange('delai', e.target.value)} placeholder="Ex: 3-5 jours" />
              </div>
              <div className="form-group">
                <label className="form-label">Devise</label>
                <select className="form-input" value={modal.tarif.devise || 'USD'} onChange={e => handleChange('devise', e.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GNF">GNF (Fr)</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="tarif-actif" checked={modal.tarif.actif || false} onChange={e => handleChange('actif', e.target.checked)} />
              <label htmlFor="tarif-actif" className="form-label" style={{ margin: 0 }}>Tarif actif (visible sur le site)</label>
            </div>
            <button className="btn btn-primary" onClick={saveTarif} disabled={saving}>
              {saving ? 'Sauvegarde...' : (modal.isNew ? 'Ajouter le tarif' : 'Enregistrer')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
