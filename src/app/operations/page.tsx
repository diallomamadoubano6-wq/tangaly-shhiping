'use client';

import { useState, useEffect } from 'react';
import styles from './operations.module.css';
import { Package, Truck, CheckCircle, Trophy, Wallet, Search, MapPin, Phone, Mail, ChevronDown, FileText, BarChart2, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

type Shipment = {
  id: string;
  tracking_number: string;
  statut: string;
  client?: { user?: { nom: string } };
  destination: string;
  poids: number;
  totalAmount: number;
  amountPaid: number;
};

export default function AgentDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const token = localStorage.getItem('tangaly_client_token') || '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/shipments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setShipments(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load shipments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  const totalShipments = shipments.length;
  const pending = shipments.filter(s => ['CREATED', 'PENDING', 'PREPARATION', 'EN_ATTENTE'].includes(s.statut)).length;
  const inTransit = shipments.filter(s => ['EN_TRANSIT', 'TRANSIT'].includes(s.statut)).length;
  const delivered = shipments.filter(s => s.statut === 'LIVRE' || s.statut === 'DELIVERED').length;
  const totalCollected = shipments.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);

  const getStatusStyle = (statut: string) => {
    const s = statut.toUpperCase();
    if (s.includes('LIVRE') || s.includes('DELIVERED')) return styles['status-livre'];
    if (s.includes('TRANSIT')) return styles['status-transit'];
    if (s.includes('PREP') || s.includes('ATTENTE') || s.includes('PENDING')) return styles['status-prep'];
    return styles['status-enregistre'];
  };

  const getStatusLabel = (statut: string) => {
    const s = statut.toUpperCase();
    if (s.includes('LIVRE') || s.includes('DELIVERED')) return 'Livré';
    if (s.includes('TRANSIT')) return 'En transit';
    if (s.includes('PREP')) return 'Préparation';
    if (s.includes('ATTENTE') || s.includes('PENDING')) return 'En attente';
    return 'Enregistré';
  };

  return (
    <>
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Total Expéditions</p>
            <div className={styles.kpiIcon}><Package size={18} color="#94a3b8"/></div>
          </div>
          <p className={styles.kpiValue}>{loading ? '...' : totalShipments}</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>En attente / Prép</p>
            <div className={styles.kpiIcon}><Trophy size={18} color="#f59e0b"/></div>
          </div>
          <p className={styles.kpiValue}>{loading ? '...' : pending}</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>En Transit</p>
            <div className={styles.kpiIcon}><Truck size={18} color="#6366f1"/></div>
          </div>
          <p className={styles.kpiValue}>{loading ? '...' : inTransit}</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Livrés</p>
            <div className={styles.kpiIcon}><CheckCircle size={18} color="#10b981"/></div>
          </div>
          <p className={styles.kpiValue}>{loading ? '...' : delivered}</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Montant Collecté</p>
            <div className={styles.kpiIcon}><Wallet size={18} color="#ef4444"/></div>
          </div>
          <p className={styles.kpiValue}>{loading ? '...' : `$${totalCollected}`}</p>
        </div>
      </div>

      {/* Graphique + Répartition par statut */}
      <div className={styles.middleRow}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Expéditions (ce mois)</h2>
              <p className={styles.cardSubtitle}>Courbe de tendance journalière</p>
            </div>
            <select style={{fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer', outline: 'none', fontWeight: 500}}>
              <option>Ce mois</option>
              <option>3 derniers mois</option>
              <option>Cette année</option>
            </select>
          </div>
          <div style={{height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position:'relative'}}>
            <div style={{position:'absolute', width:'100%', height:'100%', borderBottom:'1px solid #e2e8f0', borderLeft:'1px solid #e2e8f0'}}>
              <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                <path d="M0,180 L100,180 L200,180 L250,180 L350,50 L450,180 L500,180" fill="none" stroke="#3b82f6" strokeWidth="3" />
                <path d="M0,180 L100,180 L200,180 L250,180 L350,50 L450,180 L500,180 L500,200 L0,200 Z" fill="rgba(59, 130, 246, 0.1)" />
                <circle cx="350" cy="50" r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Répartition par statut</h2>
              <p className={styles.cardSubtitle}>Pourcentages par étape</p>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
            <div style={{position:'relative', width:140, height:140, marginBottom:16}}>
              <div style={{width:140, height:140, borderRadius:'50%', background: `conic-gradient(#f59e0b 0% ${pending > 0 ? Math.round(pending/Math.max(totalShipments,1)*100) : 0}%, #10b981 ${pending > 0 ? Math.round(pending/Math.max(totalShipments,1)*100) : 0}% ${pending > 0 ? Math.round((pending+delivered)/Math.max(totalShipments,1)*100) : 0}%, #3b82f6 ${pending > 0 ? Math.round((pending+delivered)/Math.max(totalShipments,1)*100) : 0}% 100%)`, display:'flex', alignItems:'center', justifyContent:'center'}}>
                <div style={{width:90, height:90, borderRadius:'50%', background:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                  <span style={{fontSize:24, fontWeight:800, color:'#0f172a'}}>{totalShipments}</span>
                  <span style={{fontSize:11, color:'#64748b'}}>Total colis</span>
                </div>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px', fontSize:13}}>
              <span style={{color:'#64748b'}}>● <span style={{color:'#f59e0b', fontWeight:600}}>En attente</span> : {pending}</span>
              <span style={{color:'#64748b'}}>● <span style={{color:'#3b82f6', fontWeight:600}}>En transit</span> : {inTransit}</span>
              <span style={{color:'#64748b'}}>● <span style={{color:'#10b981', fontWeight:600}}>Livré</span> : {delivered}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dernières expéditions */}
      <div className={styles.middleRow}>
        <div className={styles.chartCard} style={{gridColumn: 'span 2'}}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Dernières expéditions</h2>
              <Link href="/operations/shipments" style={{color:'#2563eb', fontSize:12, fontWeight:500, textDecoration:'none'}}>Voir toutes les expéditions</Link>
            </div>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Expédition</th>
                <th>Client</th>
                <th>Destination</th>
                <th>Poids</th>
                <th>Statut</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{textAlign:'center', padding:20}}>Chargement...</td></tr>
              ) : shipments.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center', padding:20}}>Aucune expédition</td></tr>
              ) : (
                shipments.slice(0, 5).map(s => (
                  <tr key={s.id}>
                    <td style={{fontWeight:500}}>{s.tracking_number}</td>
                    <td>{s.client?.user?.nom || 'Inconnu'}</td>
                    <td>{s.destination}</td>
                    <td>{s.poids ? s.poids + ' kg' : '-'}</td>
                    <td><span className={`${styles.statusBadge} ${getStatusStyle(s.statut)}`}>{getStatusLabel(s.statut)}</span></td>
                    <td style={{fontWeight:600}}>${s.totalAmount || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className={styles.bottomGrid}>
        <div className={styles.rightCol} style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px'}}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Actions rapides</h2>
            </div>
            <div className={styles.actionsGrid}>
               <Link href="/operations/new" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><Package size={24} color="#8b5cf6"/></div>
                  Nouvelle<br/>expédition
               </Link>
               <Link href="/operations/tracking" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><Search size={24} color="#0ea5e9"/></div>
                  Rechercher
               </Link>
               <Link href="/operations/invoices" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><FileText size={24} color="#64748b"/></div>
                  Factures
               </Link>
               <Link href="/operations/scanner" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><MapPin size={24} color="#ec4899"/></div>
                  Scanner un<br/>colis
               </Link>
            </div>
          </div>
          
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Informations agence</h2>
            </div>
            <div className={styles.infoList}>
               <div className={styles.infoItem}>
                  <Building2 size={16}/>
                  <span className={styles.infoLabel}>Agent :</span>
                  <span className={styles.infoValue}>{user?.nom || 'Inconnu'}</span>
               </div>
               <div className={styles.infoItem}>
                  <Mail size={16}/>
                  <span className={styles.infoLabel}>Email :</span>
                  <span className={styles.infoValue}>{user?.email || 'Inconnu'}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
