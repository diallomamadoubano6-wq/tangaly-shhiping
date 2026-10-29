"use client";

import React, { useState, useEffect } from 'react';
import styles from '../operations.module.css';
import { 
  ArrowRightLeft, Search, Plus, Filter, CheckCircle, Clock, 
  XCircle, Send, Building2, User, DollarSign, FileText, Users, Wallet 
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getShipments } from '@/actions/shipments';

type Transfer = {
  id: string;
  fromName: string;
  toName: string;
  amount: number;
  currency: 'USD' | 'GNF';
  date: string;
  status: 'completed' | 'pending' | 'failed';
  note: string;
  errorMsg?: string;
};

const AGENCIES = [
  'Administration TANGALY (Siège)',
  'Agence Conakry (Madina)',
  'Agence Matam',
  'Agence Labé',
  'Agence Kindia',
  'Agence Mamou',
  'Hub New York (USA)'
];

export default function AdminTransfersPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [shipments, setShipments] = useState<any[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  // Form state
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'GNF'>('USD');
  const [newNote, setNewNote] = useState('');
  const [sourceAgency, setSourceAgency] = useState<string>('Administration TANGALY (Siège)');
  const [targetAgency, setTargetAgency] = useState<string>('Agence Conakry (Madina)');
  const [formError, setFormError] = useState('');

  // 1. Fetch real shipments to get global collected cash
  useEffect(() => {
    async function loadShipments() {
      try {
        const res = await getShipments();
        if (res.success && res.data) {
          setShipments(res.data);
        }
      } catch (err) {
        console.error("Erreur chargement expéditions:", err);
      } finally {
        setLoadingShipments(false);
      }
    }
    loadShipments();
  }, []);

  // 2. Load transfer history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tangaly_internal_transfers');
      if (stored) {
        setTransfers(JSON.parse(stored));
      } else {
        setTransfers([]);
      }
    } catch (e) {
      console.warn("Storage warning:", e);
    }
  }, []);

  // Metrics
  const totalCollectedUSD = shipments.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);
  
  const totalTransfersToAdminUSD = transfers
    .filter(t => t.toName.includes('Administration') && t.status === 'completed' && t.currency === 'USD')
    .reduce((sum, t) => sum + t.amount, 0);

  const baseAdminUSD = 10000;
  const currentAdminUSD = baseAdminUSD + totalTransfersToAdminUSD;

  const saveTransfers = (newTransfers: Transfer[]) => {
    setTransfers(newTransfers);
    try {
      localStorage.setItem('tangaly_internal_transfers', JSON.stringify(newTransfers));
    } catch (e) {}
  };

  const handleSubmit = () => {
    setFormError('');
    const amount = Number(newAmount);
    if (!amount || amount <= 0) {
      setFormError('Veuillez saisir un montant valide.');
      return;
    }

    if (sourceAgency === targetAgency) {
      setFormError('L\'agence source et l\'agence destinataire doivent être différentes.');
      return;
    }

    const newTransfer: Transfer = {
      id: `VIR-${Date.now().toString().slice(-4)}`,
      fromName: sourceAgency,
      toName: targetAgency,
      amount,
      currency: newCurrency,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'completed',
      note: newNote || 'Transfert de fonds validé par l\'Administration',
    };

    saveTransfers([newTransfer, ...transfers]);
    setShowNewModal(false);
    setNewAmount('');
    setNewNote('');
  };

  const formatBalance = (amount: number, currency: 'USD' | 'GNF') => {
    if (currency === 'USD') return `$${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${amount.toLocaleString('fr-FR')} GNF`;
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Virements & Trésorerie Centrale</h1>
          <p className={styles.pageSubtitle}>
            Suivi des versements de caisse reçus des agences et transferts inter-agences.
          </p>
        </div>
        <button 
          className={styles.primaryButton} 
          onClick={() => { setFormError(''); setShowNewModal(true); }}
        >
          <Plus size={18} /> Nouveau virement
        </button>
      </div>

      {/* KPI Cards connectées */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Carte 1 : Trésorerie Siège */}
        <div className={styles.kpiCard} style={{ background: '#faf5ff', border: '1.5px solid #f3e8ff' }}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Trésorerie Centrale (Siège)</p>
            <div className={styles.kpiIcon} style={{ background: '#f3e8ff' }}>
              <Building2 size={16} color="#7e22ce" />
            </div>
          </div>
          <p className={styles.kpiValue} style={{ fontSize: 22, color: '#7e22ce' }}>
            ${currentAdminUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={styles.kpiTrend} style={{ color: '#9333ea', fontSize: 12 }}>
            Versements agences reçus : <strong>+${totalTransfersToAdminUSD.toFixed(2)}</strong>
          </p>
        </div>

        {/* Carte 2 : Total collecté réseau */}
        <div className={styles.kpiCard} style={{ background: 'white', border: '1.5px solid #e2e8f0' }}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Total Collecté Réseau (Colis)</p>
            <div className={styles.kpiIcon} style={{ background: '#eff6ff' }}>
              <Wallet size={16} color="#2563eb" />
            </div>
          </div>
          <p className={styles.kpiValue} style={{ fontSize: 22, color: '#1e293b' }}>
            {loadingShipments ? '...' : `$${totalCollectedUSD.toFixed(2)}`}
          </p>
          <p className={styles.kpiTrend} style={{ color: '#64748b', fontSize: 12 }}>
            {shipments.length} expéditions enregistrées
          </p>
        </div>

        {/* Carte 3 : Total virements */}
        <div className={styles.kpiCard} style={{ background: 'white', border: '1.5px solid #e2e8f0' }}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Virements Effectués</p>
            <div className={styles.kpiIcon} style={{ background: '#dcfce7' }}>
              <ArrowRightLeft size={16} color="#16a34a" />
            </div>
          </div>
          <p className={styles.kpiValue} style={{ fontSize: 22, color: '#16a34a' }}>
            {transfers.filter(t => t.status === 'completed').length}
          </p>
          <p className={styles.kpiTrend} style={{ color: '#16a34a', fontSize: 12 }}>
            Opérations enregistrées
          </p>
        </div>
      </div>

      {/* Tableau des virements */}
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Rechercher un virement ou motif..." className={styles.searchInput} />
          </div>
          <button className={styles.secondaryButton}><Filter size={18} /> Filtrer</button>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Réf</th>
                <th>Source</th>
                <th>Bénéficiaire</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Motif</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <ArrowRightLeft size={28} color="#94a3b8" />
                      <p style={{ margin: 0, fontWeight: 600 }}>Aucun virement enregistré pour le moment.</p>
                      <p style={{ margin: 0, fontSize: 12 }}>
                        Les versements effectués par les agents apparaîtront automatiquement ici en temps réel.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.id}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ background: t.fromName.includes('Administration') ? '#f3e8ff' : '#eff6ff', borderRadius: '50%', padding: 4, display: 'inline-flex' }}>
                          {t.fromName.includes('Administration') ? <Building2 size={13} color="#7e22ce" /> : <User size={13} color="#2563eb" />}
                        </div>
                        <span style={{ fontSize: 13 }}>{t.fromName}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ background: t.toName.includes('Administration') ? '#f3e8ff' : '#eff6ff', borderRadius: '50%', padding: 4, display: 'inline-flex' }}>
                          {t.toName.includes('Administration') ? <Building2 size={13} color="#7e22ce" /> : <User size={13} color="#2563eb" />}
                        </div>
                        <span style={{ fontSize: 13 }}>{t.toName}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatBalance(t.amount, t.currency)}</td>
                    <td>{t.date}</td>
                    <td>
                      {t.status === 'completed' && <span className={`${styles.badge} ${styles.badgeSuccess}`}><CheckCircle size={13}/> Effectué</span>}
                      {t.status === 'pending' && <span className={`${styles.badge} ${styles.badgeWarning}`}><Clock size={13}/> En attente</span>}
                      {t.status === 'failed' && <span className={`${styles.badge} ${styles.badgeError}`}><XCircle size={13}/> Refusé</span>}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{t.note}</td>
                    <td>
                      <button className={styles.textButton} onClick={() => setSelectedTransfer(t)}>
                        Détails
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Détails */}
      {selectedTransfer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Reçu de Virement {selectedTransfer.id}</h2>
              <button className={styles.closeButton} onClick={() => setSelectedTransfer(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <Send size={15}/>
                  <span className={styles.infoLabel}>De</span>
                  <span className={styles.infoValue}>{selectedTransfer.fromName}</span>
                </div>
                <div className={styles.infoItem}>
                  <ArrowRightLeft size={15}/>
                  <span className={styles.infoLabel}>À</span>
                  <span className={styles.infoValue}>{selectedTransfer.toName}</span>
                </div>
                <div className={styles.infoItem}>
                  <DollarSign size={15}/>
                  <span className={styles.infoLabel}>Montant</span>
                  <span className={styles.infoValue} style={{ fontWeight: 700, color: '#2563eb', fontSize: 18 }}>
                    {formatBalance(selectedTransfer.amount, selectedTransfer.currency)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <FileText size={15}/>
                  <span className={styles.infoLabel}>Motif</span>
                  <span className={styles.infoValue}>{selectedTransfer.note}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={() => setSelectedTransfer(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Virement */}
      {showNewModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Nouveau Virement Interne</h2>
              <button className={styles.closeButton} onClick={() => setShowNewModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Agence Source</label>
                <select 
                  className={styles.input} 
                  value={sourceAgency} 
                  onChange={e => setSourceAgency(e.target.value)}
                >
                  {AGENCIES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Agence Destinataire</label>
                <select 
                  className={styles.input} 
                  value={targetAgency} 
                  onChange={e => setTargetAgency(e.target.value)}
                >
                  {AGENCIES.filter(a => a !== sourceAgency).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Montant</label>
                  <input 
                    type="number" 
                    step="any"
                    className={styles.input} 
                    placeholder="Ex: 500" 
                    value={newAmount} 
                    onChange={e => setNewAmount(e.target.value)} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Devise</label>
                  <select 
                    className={styles.input} 
                    value={newCurrency} 
                    onChange={e => setNewCurrency(e.target.value as 'USD' | 'GNF')}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="GNF">GNF</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Motif / Observation</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ex: Avance opérationnelle, renflement caisse..." 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)} 
                />
              </div>

              {formError && (
                <div style={{ padding: '10px 12px', background: '#fef2f2', borderRadius: 8, color: '#b91c1c', fontSize: 13, borderLeft: '3px solid #ef4444' }}>
                  {formError}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={() => setShowNewModal(false)}>Annuler</button>
              <button className={styles.primaryButton} onClick={handleSubmit}>
                <Send size={16}/> Valider le virement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
