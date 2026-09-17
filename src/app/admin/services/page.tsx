'use client';

import { useState, useEffect, useCallback } from 'react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { getServices, updateService } from '@/actions/logistics';
import styles from './services.module.css';

type Service = {
  id: string;
  image_url: string;
  titre: string;
  description: string;
  href: string;
  ordre: number;
  actif: boolean;
};

export default function ServicesAdminPage() {
  const { addToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ open: boolean; service: Service | null }>({ open: false, service: null });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`;
  const getAuthHeader = () => ({ 'Authorization': 'Bearer fake-token-for-dev' }); // A adapter si l'auth change

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getServices();
      // map image to image_url and href to prevent TS errors in the old UI since schema differs slightly
      const mapped = data.map(s => ({...s, image_url: s.image, href: `/services/${s.id}`, ordre: 0 }));
      setServices(mapped as any);
    } catch (e) {
      addToast('error', 'Erreur chargement services');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openEdit = (service: Service) => setEditModal({ open: true, service: { ...service } });

  const handleChange = (key: keyof Service, value: string | number | boolean) => {
    setEditModal(prev => prev.service ? { ...prev, service: { ...prev.service, [key]: value } } : prev);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !editModal.service) return;
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_URL}/media`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData
      });
      const json = await res.json();
      
      if (res.ok && json.urlWebp) {
        // mediaRoute returns { urlWebp: '...' } as public url
        const publicUrl = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')}${json.urlWebp}`; // ajuster l'URL selon l'environnement
        handleChange('image_url', publicUrl);
        addToast('success', 'Image uploadée !');
      } else {
        addToast('error', 'Erreur upload image');
      }
    } catch (e) {
      addToast('error', 'Erreur upload image');
    }
    setUploading(false);
  };

  const saveService = async () => {
    if (!editModal.service) return;
    setSaving(true);
    const { id, image_url, href, ordre, ...updates } = editModal.service;
    
    try {
      await updateService(id, { ...updates, image: image_url });
      addToast('success', 'Service mis à jour ! Le site est à jour.'); 
      setEditModal({ open: false, service: null }); 
      fetchServices();
    } catch (e) {
      addToast('error', 'Erreur sauvegarde');
    }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Gestion des Services</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'var(--color-orange-light)', padding: '4px 12px', borderRadius: '999px' }}>
          🔗 Lié directement au site public
        </span>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div className={styles.servicesGrid}>
          {services.map(service => (
            <div key={service.id} className={`${styles.serviceCard} ${!service.actif ? styles.inactive : ''}`}>
              <div className={styles.imagePreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.image_url} alt={service.titre} />
              </div>
              <div className={styles.serviceInfo}>
                <h3>{service.titre}</h3>
                <p>{service.description}</p>
                <div className={styles.cardActions}>
                  <span className={service.actif ? styles.badgeActif : styles.badgeInactif}>
                    {service.actif ? 'Actif' : 'Inactif'}
                  </span>
                  <button className="btn btn-primary btn-sm" onClick={() => openEdit(service)}>Modifier</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, service: null })} title="Modifier le Service">
        {editModal.service && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className={styles.imageEditPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={editModal.service.image_url} alt={editModal.service.titre} />
            </div>
            <div className="form-group">
              <label className="form-label">Remplacer l&apos;image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="form-input" disabled={uploading} />
              {uploading && <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Upload en cours...</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Titre du service</label>
              <input type="text" className="form-input" value={editModal.service.titre} onChange={e => handleChange('titre', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={editModal.service.description} onChange={e => handleChange('description', e.target.value)} rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Lien (href)</label>
              <input type="text" className="form-input" value={editModal.service.href} onChange={e => handleChange('href', e.target.value)} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="actif" checked={editModal.service.actif} onChange={e => handleChange('actif', e.target.checked)} />
              <label htmlFor="actif" className="form-label" style={{ margin: 0 }}>Service visible sur le site</label>
            </div>
            <button className="btn btn-primary" onClick={saveService} disabled={saving || uploading}>
              {saving ? 'Sauvegarde...' : 'Enregistrer — Le site se met à jour instantanément'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
