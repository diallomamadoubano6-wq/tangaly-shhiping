'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClientDocuments } from '@/actions/client';
import { FileText, Eye, Download, FolderArchive } from 'lucide-react';
import styles from './documents.module.css';

type DocType = 'all' | 'invoice' | 'bl' | 'customs' | 'receipt';

const TYPE_LABELS: Record<DocType, string> = {
  all: 'Tous', invoice: 'Factures', bl: 'Connaissements', customs: 'Douane', receipt: 'Reçus',
};

export default function ClientDocumentsPage() {
  const [activeType, setActiveType] = useState<DocType>('all');
  const [search, setSearch] = useState('');
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await getClientDocuments();
      if (res.success && res.data) {
        setDocs(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filtered = docs.filter((d) => {
    const matchType = activeType === 'all' || d.type === activeType;
    const searchTarget = (d.nom + ' ' + (d.shipment?.tracking_number || '')).toLowerCase();
    const matchSearch = !search || searchTarget.includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Documents</h1>
          <p className={styles.sub}>Consultez et téléchargez vos documents d'expédition.</p>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Rechercher un document..."
          className={`form-input ${styles.search}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher un document"
        />
        <nav className={styles.tabs} aria-label="Filtrer par type de document">
          {(Object.keys(TYPE_LABELS) as DocType[]).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${activeType === t ? styles.tabActive : ''}`}
              onClick={() => setActiveType(t)}
              aria-current={activeType === t ? 'page' : undefined}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </nav>
      </div>

      {/* Liste documents */}
      {loading ? (
        <p style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>Chargement...</p>
      ) : filtered.length > 0 ? (
        <ul className={styles.docList} role="list" aria-label="Documents">
          {filtered.map((doc) => (
            <li key={doc.id} className={styles.docCard}>
              <div className={styles.docIcon} aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} className="text-primary" />
              </div>
              <div className={styles.docInfo}>
                <p className={styles.docName}>{doc.nom}</p>
                <div className={styles.docMeta}>
                  <span>Expédition : <strong>{doc.shipment?.tracking_number || 'N/A'}</strong></span>
                  <span>-</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={styles.docActions}>
                <button className="btn btn-outline btn-sm" title="Aperçu" aria-label={`Aperçu de ${doc.nom}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Eye size={14} /> Aperçu
                </button>
                <button className="btn btn-primary btn-sm" title="Télécharger" aria-label={`Télécharger ${doc.nom}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Download size={14} /> Télécharger
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="state-container">
          <span className="state-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            <FolderArchive size={40} />
          </span>
          <h3 className="state-title">Aucun document trouvé</h3>
          <p>Essayez avec d'autres termes ou filtres.</p>
        </div>
      )}
    </div>
  );
}
