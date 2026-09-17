'use client';

import { useState, useEffect, useCallback } from 'react';

import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '@/actions/cms';
import styles from './faq.module.css';

type FaqItem = {
  id: string;
  question: string;
  reponse: string;
  ordre: number;
  publie: boolean;
};

export default function FaqAdminPage() {
  const { addToast } = useToast();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item: Partial<FaqItem> | null; isNew: boolean }>({ open: false, item: null, isNew: false });
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`;
  const getAuthHeader = () => ({ 'Authorization': 'Bearer fake-token-for-dev', 'Content-Type': 'application/json' }); 

  const fetchFaq = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFaqs();
      // The schema for Faq may not have `publie`. If so we map it. 
      // Wait, in schema, Faq doesn't have `publie`! Let's map it to always true for now, or use `actif` if we added it?
      // Looking at Prisma schema: Faq: id, question, reponse, ordre, createdAt, updatedAt
      const mapped = data.map(f => ({ ...f, publie: true }));
      setItems(mapped as any);
    } catch (e) {
      addToast('error', 'Erreur chargement FAQ');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { fetchFaq(); }, [fetchFaq]);

  const openCreate = () => setModal({ open: true, item: { question: '', reponse: '', ordre: items.length + 1, publie: true }, isNew: true });
  const openEdit = (item: FaqItem) => setModal({ open: true, item: { ...item }, isNew: false });

  const handleChange = (key: keyof FaqItem, value: string | number | boolean) =>
    setModal(prev => prev.item ? { ...prev, item: { ...prev.item, [key]: value } } : prev);

  const saveItem = async () => {
    if (!modal.item) return;
    setSaving(true);
    try {
      const dbFaq = {
        question: modal.item.question,
        reponse: modal.item.reponse,
        ordre: modal.item.ordre || 0
        // publie non inclus car absent du schema
      };
      
      if (modal.isNew) {
        await createFaq(dbFaq);
        addToast('success', 'Question ajoutée !');
      } else {
        const { id } = modal.item as FaqItem;
        await updateFaq(id, dbFaq);
        addToast('success', 'FAQ mise à jour !');
      }
      setModal({ open: false, item: null, isNew: false });
      fetchFaq();
    } catch (e) {
      addToast('error', 'Erreur sauvegarde');
    }
    setSaving(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Supprimer cette question ?')) return;
    try {
      await deleteFaq(id);
      addToast('success', 'Question supprimée');
      fetchFaq();
    } catch (e) {
      addToast('error', 'Erreur suppression');
    }
  };

  const togglePublie = async (item: FaqItem) => {
    addToast('info', 'La visibilité (publie) n\'est pas encore gérée en DB');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Gestion de la FAQ</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'var(--color-orange-light)', padding: '4px 12px', borderRadius: '999px' }}>
            🔗 Lié au site public
          </span>
          <button className="btn btn-primary" onClick={openCreate}>+ Ajouter une question</button>
        </div>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div className={styles.faqList}>
          {items.map((item, idx) => (
            <div key={item.id} className={`${styles.faqItem} ${!item.publie ? styles.hidden : ''}`}>
              <div className={styles.faqOrder}>{idx + 1}</div>
              <div className={styles.faqContent}>
                <p className={styles.question}>{item.question}</p>
                <p className={styles.reponse}>{item.reponse}</p>
              </div>
              <div className={styles.faqActions}>
                <button
                  className={`btn btn-sm ${item.publie ? '' : ''}`}
                  style={{ background: item.publie ? '#f0fff4' : '#fff1f2', color: item.publie ? '#16a34a' : '#e11d48', border: 'none' }}
                  onClick={() => togglePublie(item)}
                >
                  {item.publie ? 'Visible' : 'Masqué'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}>Modifier</button>
                <button
                  className="btn btn-sm"
                  style={{ background: '#fff1f2', color: '#e11d48', border: 'none' }}
                  onClick={() => handleDeleteItem(item.id)}
                >✕</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Aucune question. Ajoutez la première !</p>}
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, item: null, isNew: false })} title={modal.isNew ? 'Nouvelle Question' : 'Modifier la Question'}>
        {modal.item && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Question</label>
              <input type="text" className="form-input" value={modal.item.question || ''} onChange={e => handleChange('question', e.target.value)} placeholder="Ex: Combien de temps prend une livraison ?" />
            </div>
            <div className="form-group">
              <label className="form-label">Réponse</label>
              <textarea className="form-textarea" value={modal.item.reponse || ''} onChange={e => handleChange('reponse', e.target.value)} rows={4} />
            </div>
            <div className="form-group">
              <label className="form-label">Ordre d&apos;affichage</label>
              <input type="number" className="form-input" value={modal.item.ordre || 0} onChange={e => handleChange('ordre', parseInt(e.target.value))} style={{ maxWidth: 100 }} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="faq-publie" checked={modal.item.publie || false} onChange={e => handleChange('publie', e.target.checked)} />
              <label htmlFor="faq-publie" className="form-label" style={{ margin: 0 }}>Visible sur le site</label>
            </div>
            <button className="btn btn-primary" onClick={saveItem} disabled={saving}>
              {saving ? 'Sauvegarde...' : (modal.isNew ? 'Ajouter' : 'Enregistrer')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
