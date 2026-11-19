'use client';
import { useState, useEffect } from 'react';
import styles from '../operations.module.css';
import { RotateCcw, Search, PackageX } from 'lucide-react';
import { getReturnedShipments } from '@/actions/shipments';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getReturnedShipments();
        if (res.success && res.data) {
          setReturns(res.data);
        }
      } catch (err) {
        console.error("Erreur chargement retours:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = returns.filter((r) => {
    const term = search.toLowerCase();
    const tracking = (r.tracking_number || '').toLowerCase();
    const clientName = (r.client?.user?.nom || r.receiverName || '').toLowerCase();
    return tracking.includes(term) || clientName.includes(term);
  });

  return (
    <div className={styles.dashboard}>
      <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className={styles.cardTitle}>Colis Retournés</h2>
          <p className={styles.cardSubtitle}>Gérez les expéditions non livrées ou retournées par le destinataire.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: 10 }}><Search size={16} color="#94a3b8" /></div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (N° Suivi, Client)"
              style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: 14, width: 250 }}
            />
          </div>
        </div>
      </div>

      <div className={styles.chartCard} style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13, textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>N° Suivi</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Client expéditeur</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Dernier Événement</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Date de mise à jour</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Statut actuel</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Chargement des retours...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
                  <PackageX size={40} color="#94a3b8" style={{ marginBottom: 12, display: 'inline-block' }} />
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: '#334155' }}>
                    {search ? 'Aucun résultat pour cette recherche' : 'Aucun colis retourné dans la base de données'}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>
                    {search ? 'Essayez avec un autre numéro ou nom.' : 'Tous les colis sont en cours d’acheminement ou livrés normalement.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => (
                <tr key={s.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 500, color: '#0f172a' }}>{s.tracking_number}</td>
                  <td style={{ padding: '16px 24px', color: '#334155' }}>{s.client?.user?.nom || 'Client direct'}</td>
                  <td style={{ padding: '16px 24px', color: '#dc2626' }}>
                    {s.tracking_events?.[0]?.commentaire || 'Retour enregistré'}
                  </td>
                  <td style={{ padding: '16px 24px', color: '#64748b' }}>
                    {new Date(s.updatedAt || s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '999px', fontSize: 12, fontWeight: 500 }}>
                      {(s.statut || '').replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
