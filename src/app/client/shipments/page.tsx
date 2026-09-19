'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStatusInfo, SHIPMENT_STATUSES } from '@/lib/trackingStatuses';
import { getClientShipments } from '@/actions/client';
import { Package, X, Search, FileText } from 'lucide-react';
import { StatusIcon } from '@/components/ui';
import styles from './shipments.module.css';

export default function ClientShipmentsPage() {
  const [search, setSearch]       = useState('');
  const [filterStatut, setFilter] = useState('');
  const [shipments, setShipments] = useState<any[]>([]);
  const [selected, setSelected]   = useState<any | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await getClientShipments();
      if (res.success && res.data) {
        setShipments(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filtered = shipments.filter((s) => {
    const matchSearch = !search ||
      s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || s.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mes Expéditions</h1>
          <p className={styles.sub}>{shipments.length} expédition{shipments.length > 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/devis" className="btn btn-primary">+ Demander une expédition</Link>
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Rechercher par tracking ou destination..."
          className={`form-input ${styles.searchInput}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher une expédition"
        />
        <select
          className={`form-select ${styles.filterSelect}`}
          value={filterStatut}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtrer par statut"
        >
          <option value="">Tous les statuts</option>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s.code} value={s.code}>{s.icon} {s.label}</option>
          ))}
        </select>
      </div>

      {/* Layout liste + détail */}
      <div className={`${styles.listDetail} ${selected ? styles.listDetailOpen : ''}`}>
        {/* Liste */}
        <ul className={styles.list} role="list" aria-label="Liste des expéditions">
          {filtered.length > 0 ? filtered.map((s) => {
            const info = getStatusInfo(s.statut);
            return (
              <li key={s.id}>
                <button
                  className={`${styles.shipmentCard} ${selected?.id === s.id ? styles.shipmentCardActive : ''}`}
                  onClick={() => setSelected(selected?.id === s.id ? null : s)}
                  aria-pressed={selected?.id === s.id}
                  aria-label={`Expédition ${s.tracking_number}`}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.trackingNum}>{s.tracking_number}</span>
                    <span className={styles.statusBadge} style={{ color: info.color, background: info.bgColor, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <StatusIcon status={s.statut} size={13} color={info.color} />
                      <span>{info.label}</span>
                    </span>
                  </div>
                  <p className={styles.cardRoute}>{s.origine} → {s.destination}</p>
                  <div className={styles.cardMeta}>
                    <span>{s.type_transport}</span>
                    <span>{s.poids} kg</span>
                    <span>Crée le {s.date}</span>
                  </div>
                </button>
              </li>
            );
          }) : (
            <li className={styles.empty}>
              <span style={{ display: 'inline-flex', padding: 12, background: 'var(--color-gray-100)', borderRadius: '999px', color: 'var(--color-primary)' }}>
                <Package size={32} />
              </span>
              <p>Aucune expédition trouvée.</p>
            </li>
          )}
        </ul>

        {/* Détail */}
        {selected && !loading && (
          <div className={styles.detail} aria-label="Détail de l'expédition">
            <div className={styles.detailHeader}>
              <h2 className={styles.detailTracking}>{selected.tracking_number}</h2>
              <button className={styles.detailClose} onClick={() => setSelected(null)} aria-label="Fermer le détail">
                <X size={18} />
              </button>
            </div>

            {/* Statut */}
            {(() => {
              const info = getStatusInfo(selected.statut);
              return (
                <div className={styles.detailStatus} style={{ background: info.bgColor }}>
                  <span className={styles.detailStatusIcon} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: info.color }}>
                    <StatusIcon status={selected.statut} size={24} color={info.color} />
                  </span>
                  <div>
                    <p className={styles.detailStatusLabel} style={{ color: info.color }}>{info.labelFr}</p>
                    <p className={styles.detailStatusDesc}>{info.description}</p>
                  </div>
                </div>
              );
            })()}

            {/* Infos */}
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}><span>Origine</span><strong>{selected.origine}</strong></div>
              <div className={styles.detailItem}><span>Destination</span><strong>{selected.destination}</strong></div>
              <div className={styles.detailItem}><span>Transport</span><strong>{selected.type_transport}</strong></div>
              <div className={styles.detailItem}><span>Poids</span><strong>{selected.poids ? `${selected.poids} kg` : '-'}</strong></div>
              <div className={styles.detailItem}><span>Date envoi</span><strong>{new Date(selected.createdAt).toLocaleDateString()}</strong></div>
              <div className={styles.detailItem}><span>Livraison estimée</span><strong style={{ color: 'var(--color-success)' }}>-</strong></div>
            </div>

            {/* Actions */}
            <div className={styles.detailActions}>
              <Link href={`/tracking?numero=${selected.tracking_number}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Search size={15} /> Suivi détaillé
              </Link>
              <Link href="/client/documents" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} /> Voir les documents
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
