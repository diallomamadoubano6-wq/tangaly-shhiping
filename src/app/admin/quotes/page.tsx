'use client';

import { useState, useEffect, useCallback } from 'react';

import Badge, { statusToVariant } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { getQuotes, updateQuote } from '@/actions/quotes';
import styles from './quotes.module.css';

type Quote = {
  id: string;
  client_nom: string;
  client_email: string;
  client_tel: string;
  service: string;
  origine: string;
  destination: string;
  poids_estime: string;
  message: string;
  statut: 'PENDING' | 'PROCESSING' | 'ACCEPTED' | 'REFUSED';
  notes_admin: string;
  created_at: string;
};

const STATUTS = ['PENDING', 'PROCESSING', 'ACCEPTED', 'REFUSED'];
const STATUT_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  ACCEPTED: 'Accepté',
  REFUSED: 'Refusé',
};

export default function QuotesPage() {
  const { addToast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [search, setSearch] = useState('');
  const [detailModal, setDetailModal] = useState<{ open: boolean; quote: Quote | null }>({ open: false, quote: null });
  const [saving, setSaving] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQuotes();
      if (res.success && res.data) {
        setQuotes(res.data as Quote[]);
      } else {
        addToast('error', 'Erreur', 'Erreur chargement devis');
      }
    } catch (error) {
      addToast('error', 'Erreur', 'Erreur chargement devis');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  const filtered = quotes.filter(q => {
    const matchSearch = !search ||
      q.client_nom?.toLowerCase().includes(search.toLowerCase()) ||
      q.client_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || q.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const updateStatut = async (id: string, statut: string, notes: string) => {
    setSaving(true);
    try {
      const res = await updateQuote(id, statut, notes);
      
      if (res.success) {
        addToast('success', 'Succès', 'Devis mis à jour !');
        setDetailModal({ open: false, quote: null });
        fetchQuotes();
      } else {
        addToast('error', 'Erreur', res.message || 'Erreur mise à jour');
      }
    } catch (error) {
      addToast('error', 'Erreur', 'Erreur serveur');
    }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Gestion des Devis</h2>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{filtered.length} devis</span>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <input
          type="text"
          className="form-input"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select className="form-input" value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
        </select>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="table-container">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Service</th>
                  <th>Trajet</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id}>
                    <td><strong>{q.client_nom}</strong></td>
                    <td style={{ fontSize: '0.8rem' }}>{q.client_email}</td>
                    <td>{q.service}</td>
                    <td style={{ fontSize: '0.8rem' }}>{q.origine} → {q.destination}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {new Date(q.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td><Badge variant={statusToVariant(q.statut)} /></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDetailModal({ open: true, quote: q })}>
                        Voir →
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Aucun devis trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal détail */}
      <Modal isOpen={detailModal.open} onClose={() => setDetailModal({ open: false, quote: null })} title="Détail du Devis">
        {detailModal.quote && <QuoteDetail quote={detailModal.quote} onSave={updateStatut} saving={saving} />}
      </Modal>
    </div>
  );
}

function QuoteDetail({ quote, onSave, saving }: { quote: Quote; onSave: (id: string, statut: string, notes: string) => void; saving: boolean }) {
  const [statut, setStatut] = useState(quote.statut);
  const [notes, setNotes] = useState(quote.notes_admin || '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--color-gray-50)', padding: '1rem', borderRadius: '0.5rem' }}>
        <div><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Client</span><p style={{ margin: 0, fontWeight: 600 }}>{quote.client_nom}</p></div>
        <div><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Email</span><p style={{ margin: 0 }}>{quote.client_email}</p></div>
        <div><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Téléphone</span><p style={{ margin: 0 }}>{quote.client_tel || '—'}</p></div>
        <div><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Service</span><p style={{ margin: 0 }}>{quote.service}</p></div>
        <div><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Trajet</span><p style={{ margin: 0 }}>{quote.origine} → {quote.destination}</p></div>
        <div><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Poids estimé</span><p style={{ margin: 0 }}>{quote.poids_estime || '—'}</p></div>
      </div>
      {quote.message && (
        <div className="form-group">
          <label className="form-label">Message du client</label>
          <div style={{ padding: '0.75rem', background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>{quote.message}</div>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Statut</label>
        <select className="form-input" value={statut} onChange={e => setStatut(e.target.value as Quote['statut'])}>
          {['PENDING','PROCESSING','ACCEPTED','REFUSED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Notes internes (non visibles par le client)</label>
        <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </div>
      <button className="btn btn-primary" onClick={() => onSave(quote.id, statut, notes)} disabled={saving}>
        {saving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
      </button>
    </div>
  );
}
