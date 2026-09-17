'use client';

import { useState } from 'react';
import styles from '../operations.module.css';
import { Search, CheckCircle, Package, Truck, AlertTriangle } from 'lucide-react';

type TrackingEvent = {
  id: string;
  statut: string;
  commentaire: string;
  date: string;
};

type ShipmentData = {
  tracking_number: string;
  statut: string;
  origine: string;
  destination: string;
  type_transport: string;
  poids: number;
  createdAt: string;
  updatedAt: string;
  tracking_events: TrackingEvent[];
};

export default function TrackingPage() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shipment, setShipment] = useState<ShipmentData | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setSearched(query.trim().toUpperCase());
    setLoading(true);
    setError('');
    setShipment(null);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/shipments/track/${query.trim().toUpperCase()}`);
      const json = await res.json();
      
      if (json.success && json.data) {
        setShipment(json.data);
      } else {
        setError(json.message || 'Numéro de suivi introuvable');
      }
    } catch (err) {
      console.error('Erreur tracking:', err);
      setError('Une erreur réseau est survenue');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (statut: string) => {
    const s = statut.toUpperCase();
    if (s.includes('LIVRE') || s.includes('DELIVERED')) return <CheckCircle size={14} color="white"/>;
    if (s.includes('TRANSIT')) return <Truck size={14} color="white"/>;
    return <Package size={14} color="#64748b"/>;
  };

  const getStatusBg = (statut: string) => {
    const s = statut.toUpperCase();
    if (s.includes('LIVRE') || s.includes('DELIVERED')) return '#10b981';
    if (s.includes('TRANSIT')) return '#2563eb';
    return '#e2e8f0';
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Suivi des Colis</h1>
          <p className={styles.pageSubtitle}>Recherchez l'historique complet d'un colis.</p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Barre de recherche */}
        <form onSubmit={handleSearch}>
          <div className={styles.toolbar}>
            <div className={styles.searchBox} style={{maxWidth: 480}}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Entrez le N° de suivi (ex: TNX-...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
                disabled={loading}
              />
            </div>
            <button type="submit" className={styles.primaryButton} disabled={loading}>
              {loading ? 'Recherche...' : 'Suivre'}
            </button>
          </div>
        </form>

        {/* État de chargement */}
        {loading && (
          <div style={{padding:'48px 24px', textAlign:'center', color:'#64748b'}}>
            <p>Chargement des données...</p>
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div style={{padding:'48px 24px', textAlign:'center', color:'#ef4444'}}>
            <AlertTriangle size={40} style={{margin:'0 auto 12px', display:'block', color:'#ef4444'}}/>
            <p style={{margin:0, fontSize:16, fontWeight: 600}}>{error}</p>
          </div>
        )}

        {/* Résultats uniquement si une recherche a été faite et a réussi */}
        {shipment && !loading && (
          <div style={{padding:'20px 24px 24px'}}>
            <h3 style={{fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:20, display:'flex', alignItems:'center', gap:8}}>
              <Package size={18} color="#2563eb"/> Colis {shipment.tracking_number}
            </h3>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:30, background:'#f8fafc', padding:16, borderRadius:8}}>
              <div>
                <p style={{margin:0, fontSize:12, color:'#64748b'}}>Origine</p>
                <p style={{margin:0, fontSize:14, fontWeight:600}}>{shipment.origine}</p>
              </div>
              <div>
                <p style={{margin:0, fontSize:12, color:'#64748b'}}>Destination</p>
                <p style={{margin:0, fontSize:14, fontWeight:600}}>{shipment.destination}</p>
              </div>
              <div>
                <p style={{margin:0, fontSize:12, color:'#64748b'}}>Poids</p>
                <p style={{margin:0, fontSize:14, fontWeight:600}}>{shipment.poids ? `${shipment.poids} kg` : '-'}</p>
              </div>
              <div>
                <p style={{margin:0, fontSize:12, color:'#64748b'}}>Statut Actuel</p>
                <p style={{margin:0, fontSize:14, fontWeight:600, color:'#2563eb'}}>{shipment.statut}</p>
              </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:0, paddingLeft:8, borderLeft:'2px solid #e2e8f0', marginLeft:8}}>
              {shipment.tracking_events.map((evt, idx) => {
                const isLast = idx === shipment.tracking_events.length - 1;
                return (
                  <div key={evt.id} style={{position:'relative', paddingLeft:24, paddingBottom: isLast ? 8 : 24}}>
                    <div style={{position:'absolute', left:-13, top:0, background: getStatusBg(evt.statut), borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {getStatusIcon(evt.statut)}
                    </div>
                    <p style={{margin:0, fontWeight:600, color:'#0f172a', fontSize:14}}>{evt.statut}</p>
                    <p style={{margin:'3px 0 0', fontSize:13, color:'#64748b'}}>{evt.commentaire}</p>
                    <span style={{fontSize:12, color:'#94a3b8'}}>{new Date(evt.date).toLocaleString('fr-FR')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* État vide — avant toute recherche */}
        {!searched && !loading && !error && (
          <div style={{padding:'48px 24px', textAlign:'center', color:'#94a3b8'}}>
            <Package size={40} style={{margin:'0 auto 12px', display:'block', color:'#e2e8f0'}}/>
            <p style={{margin:0, fontSize:14}}>Entrez un numéro de suivi pour afficher l'historique du colis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
