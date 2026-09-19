'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClientQuotes } from '@/actions/client';
import { Clock, MessageSquare, CheckCircle2, XCircle, Plus, X, Check } from 'lucide-react';
import styles from './quotes.module.css';

const STATUT_UI: Record<string, { label: string; bg: string; color: string; icon: any }> = {
  PENDING:   { label: 'En attente', bg: '#fffff0', color: '#d69e2e', icon: Clock },
  RESPONDED: { label: 'Répondu',   bg: '#e8f0fe', color: '#0052cc', icon: MessageSquare },
  ACCEPTED:  { label: 'Accepté',   bg: '#f0fff4', color: '#38a169', icon: CheckCircle2 },
  CANCELLED: { label: 'Annulé',   bg: '#fff5f5', color: '#e53e3e', icon: XCircle },
};

export default function ClientQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await getClientQuotes();
      if (res.success && res.data) {
        setQuotes(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes Demandes de Devis</h1>
          <p className={styles.sub}>{quotes.length} demande{quotes.length > 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/devis" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} />
          <span>Nouvelle demande</span>
        </Link>
      </div>

      <div className={`${styles.listDetail} ${selected ? styles.listDetailOpen : ''}`}>
        {/* Liste */}
        <ul className={styles.list} role="list">
          {loading ? (
            <li style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Chargement...</li>
          ) : quotes.length === 0 ? (
            <li style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Aucune demande de devis.</li>
          ) : quotes.map((q) => {
            const ui = STATUT_UI[q.statut] ?? STATUT_UI.PENDING;
            const Icon = ui.icon;
            return (
              <li key={q.id}>
                <button
                  className={`${styles.quoteCard} ${selected?.id === q.id ? styles.quoteCardActive : ''}`}
                  onClick={() => setSelected(selected?.id === q.id ? null : q)}
                  aria-pressed={selected?.id === q.id}
                >
                  <div className={styles.cardTop}>
                    <strong className={styles.quoteRef}>Devis</strong>
                    <span className={styles.quoteBadge} style={{ background: ui.bg, color: ui.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon size={13} />
                      <span>{ui.label}</span>
                    </span>
                  </div>
                  <p className={styles.quoteService}>{q.service} — {q.origine} → {q.destination}</p>
                  <div className={styles.quoteMeta}>
                    <span>Poids : {q.poids_estime || 'Non rens.'}</span>
                    <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Détail */}
        {selected && !loading && (() => {
          const ui = STATUT_UI[selected.statut] ?? STATUT_UI.PENDING;
          const Icon = ui.icon;
          return (
            <div className={styles.detail}>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailRef}>Détails</h2>
                <button className={styles.closeBtn} onClick={() => setSelected(null)} aria-label="Fermer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
              <div className={styles.detailBody}>
                <div className={styles.detailStatus} style={{ background: ui.bg }}>
                  <p className={styles.detailStatusLabel} style={{ color: ui.color, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={16} />
                    <span>{ui.label}</span>
                  </p>
                </div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><span>Service</span><strong>{selected.service}</strong></div>
                  <div className={styles.detailItem}><span>Trajet</span><strong>{selected.origine} → {selected.destination}</strong></div>
                  <div className={styles.detailItem}><span>Poids</span><strong>{selected.poids_estime || 'Non renseigné'}</strong></div>
                  <div className={styles.detailItem}><span>Date</span><strong>{new Date(selected.createdAt).toLocaleDateString()}</strong></div>
                  {selected.notes_admin && selected.statut !== 'PENDING' && (
                    <div className={styles.detailItem} style={{ gridColumn: '1/-1' }}>
                      <span>Réponse / Notes de Tangaly</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-success)', whiteSpace: 'pre-wrap' }}>{selected.notes_admin}</strong>
                    </div>
                  )}
                </div>
                {selected.statut === 'RESPONDED' && (
                  <div className={styles.detailActions}>
                    <button className="btn btn-success btn-lg" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Check size={16} />
                      <span>Accepter l'offre</span>
                    </button>
                    <button className="btn btn-outline btn-lg" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <X size={16} />
                      <span>Refuser</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
