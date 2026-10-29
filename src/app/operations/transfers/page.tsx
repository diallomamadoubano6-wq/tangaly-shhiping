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

export default function TransfersPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const agentName = user?.nom || 'Agent Tangaly';
  const agencyName = user?.localisation || 'Agence Principale';
  const agentDisplayName = `${agentName} (${agencyName})`;

  const [shipments, setShipments] = useState<any[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  // Form state
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'GNF'>('USD');
  const [newNote, setNewNote] = useState('');
  const [direction, setDirection] = useState<'agent_to_admin' | 'agent_to_agent'>('agent_to_admin');
  const [targetAgency, setTargetAgency] = useState<string>('Agence Conakry (Madina)');
  const [formError, setFormError] = useState('');

  // 1. Fetch real shipments to get real collected cash
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
        // Initial empty or default list
        setTransfers([]);
      }
    } catch (e) {
      console.warn("Storage warning:", e);
    }
  }, []);

  // Calculate real metrics
  const totalCollectedUSD = shipments.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);
  
  // Total transferred to admin or other agents by this agent
  const totalTransferredUSD = transfers
    .filter(t => t.fromName === agentDisplayName && t.status === 'completed' && t.currency === 'USD')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransferredGNF = transfers
    .filter(t => t.fromName === agentDisplayName && t.status === 'completed' && t.currency === 'GNF')
    .reduce((sum, t) => sum + t.amount, 0);

  // Solde disponible en caisse de l'agent
  const availableCashUSD = Math.max(0, totalCollectedUSD - totalTransferredUSD);
  const baseFloatGNF = 5000000;
  const availableCashGNF = Math.max(0, baseFloatGNF - totalTransferredGNF);

  // Solde reçu par l'administration
  const baseAdminUSD = 10000;
  const totalReceivedAdminUSD = transfers
    .filter(t => t.toName.includes('Administration') && t.status === 'completed' && t.currency === 'USD')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentAdminUSD = baseAdminUSD + totalReceivedAdminUSD;

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

    const maxAvailable = newCurrency === 'USD' ? availableCashUSD : availableCashGNF;
    if (amount > maxAvailable) {
      setFormError(`Solde insuffisant en caisse. Disponible : ${newCurrency === 'USD' ? `$${maxAvailable.toFixed(2)}` : `${maxAvailable.toLocaleString()} GNF`}`);
      return;
    }

    const destination = direction === 'agent_to_admin' 
      ? 'Administration TANGALY (Siège)' 
      : targetAgency;

    const newTransfer: Transfer = {
      id: `VIR-${Date.now().toString().slice(-4)}`,
      fromName: agentDisplayName,
      toName: destination,
      amount,
      currency: newCurrency,
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'completed',
      note: newNote || (direction === 'agent_to_admin' ? 'Versement caisse expéditions' : 'Transfert inter-agence'),
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
          <h1 className={styles.pageTitle}>Virements & Versements de Caisse</h1>
          <p className={styles.pageSubtitle}>
            Gestion de votre caisse collectée, reversements vers le siège et transferts inter-agences.
          </p>
        </div>
        <button 
          className={styles.primaryButton} 
          onClick={() => { setFormError(''); setShowNewModal(true); }}
        >
          <Plus size={18} /> Nouveau virement
        </button>
      </div>

      {/* KPI Cards connectées aux données réelles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
        {/* Carte 1 : Ma caisse agent */}
        <div className={styles.kpiCard} style={{ background: 'white', border: '1.5px solid #e2e8f0' }}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Ma Caisse — {agentName}</p>
            <div className={styles.kpiIcon} style={{ background: '#eff6ff' }}>
              <Wallet size={16} color="#2563eb" />
            </div>
          </div>
          <p className={styles.kpiValue} style={{ fontSize: 22, color: '#1e293b' }}>
            {loadingShipments ? '...' : `$${availableCashUSD.toFixed(2)}`}
          </p>
          <p className={styles.kpiTrend} style={{ color: '#64748b', fontSize: 12 }}>
            Total collecté colis : <strong>${totalCollectedUSD.toFixed(2)} USD</strong>
          </p>
        </div>

        {/* Carte 2 : Administration TANGALY */}
        <div className={styles.kpiCard} style={{ background: '#faf5ff', border: '1.5px solid #f3e8ff' }}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Administration TANGALY (Siège)</p>
            <div className={styles.kpiIcon} style={{ background: '#f3e8ff' }}>
              <Building2 size={16} color="#7e22ce" />
            </div>
          </div>
          <p className={styles.kpiValue} style={{ fontSize: 22, color: '#7e22ce' }}>
            ${currentAdminUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={styles.kpiTrend} style={{ color: '#9333ea', fontSize: 12 }}>
            Total reçu de vos versements : +${totalTransferredUSD.toFixed(2)}
          </p>
        </div>

        {/* Carte 3 : Virements effectués */}
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
                <th>Expéditeur</th>
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
                        Votre caisse contient actuellement <strong>${availableCashUSD.toFixed(2)}</strong> collectés sur les expéditions. Cliquez sur &quot;Nouveau virement&quot; pour effectuer un versement au siège.
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
                        <div style={{ background: '#eff6ff', borderRadius: '50%', padding: 4, display: 'inline-flex' }}>
                          <User size={13} color="#2563eb" />
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
              <h2>Nouveau Virement de Caisse</h2>
              <button className={styles.closeButton} onClick={() => setShowNewModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {/* Solde actuel dynamique */}
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>Solde disponible dans ma caisse</span>
                    <strong style={{ fontSize: 18, color: '#1e293b' }}>
                      ${availableCashUSD.toFixed(2)} USD
                    </strong>
                  </div>
                  {availableCashUSD > 0 && (
                    <button 
                      type="button" 
                      onClick={() => { setNewAmount(availableCashUSD.toString()); setNewCurrency('USD'); }}
                      style={{ fontSize: 12, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Verser la totalité (${availableCashUSD.toFixed(2)})
                    </button>
                  )}
                </div>
              </div>

              {/* Direction */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Type d&apos;opération</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'agent_to_admin', label: 'Versement Caisse → Siège', icon: <Building2 size={17}/>, color: '#7e22ce', bg: '#faf5ff' },
                    { key: 'agent_to_agent', label: 'Virement vers Agence', icon: <Users size={17}/>, color: '#2563eb', bg: '#eff6ff' },
                  ].map(opt => (
                    <button 
                      key={opt.key} 
                      type="button" 
                      onClick={() => setDirection(opt.key as any)}
                      style={{
                        padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                        border: direction === opt.key ? `2px solid ${opt.color}` : '2px solid #e2e8f0',
                        background: direction === opt.key ? opt.bg : 'white',
                        color: direction === opt.key ? opt.color : '#64748b',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                      }}
                    >
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destinataire si Agence */}
              {direction === 'agent_to_agent' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Agence destinataire</label>
                  <select 
                    className={styles.input} 
                    value={targetAgency} 
                    onChange={e => setTargetAgency(e.target.value)}
                  >
                    {AGENCIES.filter(a => !a.includes(agencyName) && !a.includes('Siège')).map((ag) => (
                      <option key={ag} value={ag}>{ag}</option>
                    ))}
                  </select>
                </div>
              )}

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
                  placeholder="Ex: Versement des fonds collectés sur les colis..." 
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
