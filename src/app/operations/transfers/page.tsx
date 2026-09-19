"use client";

import React, { useState, useEffect } from 'react';
import styles from '../operations.module.css';
import { ArrowRightLeft, Search, Plus, Filter, CheckCircle, Clock, XCircle, Send, Building2, User, DollarSign, FileText, Users, Wallet } from 'lucide-react';
import { ACCOUNTS, AccountId, getWallets, transfer, formatBalance, labelToAccountId } from '../../../lib/wallet';

type Transfer = {
  id: string;
  fromId: AccountId;
  toId: AccountId;
  amount: number;
  currency: 'USD' | 'GNF';
  date: string;
  status: 'completed' | 'pending' | 'failed';
  note: string;
  errorMsg?: string;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([
    {
      id: 'VIR-001', fromId: 'agent_matam', toId: 'admin',
      amount: 1500, currency: 'USD', date: '06 Sep 2026', status: 'completed', note: 'Collecte semaine du 01-06 Sep'
    },
    {
      id: 'VIR-002', fromId: 'admin', toId: 'agent_conakry',
      amount: 500000, currency: 'GNF', date: '05 Sep 2026', status: 'completed', note: 'Avance frais opérationnels'
    },
    {
      id: 'VIR-003', fromId: 'agent_labe', toId: 'agent_matam',
      amount: 300, currency: 'USD', date: '04 Sep 2026', status: 'completed', note: 'Renflement de caisse – urgence Matam'
    },
  ]);

  const [wallets, setWallets] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);

  // Form state
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'GNF'>('USD');
  const [newNote, setNewNote] = useState('');
  const [direction, setDirection] = useState<'agent_to_agent' | 'agent_to_admin'>('agent_to_agent');
  const [targetAccountId, setTargetAccountId] = useState<AccountId>('agent_conakry');
  const [formError, setFormError] = useState('');

  // Current agent (in a real app, this comes from auth)
  const currentAgentId: AccountId = 'agent_matam';

  useEffect(() => {
    setWallets(getWallets());
  }, []);

  const refreshWallets = () => setWallets(getWallets());

  const handleSubmit = () => {
    setFormError('');
    const amount = Number(newAmount);
    if (!amount || amount <= 0) { setFormError('Montant invalide.'); return; }

    let fromId: AccountId = currentAgentId;
    let toId: AccountId = direction === 'agent_to_admin' ? 'admin' : targetAccountId;

    const result = transfer(fromId, toId, amount, newCurrency);

    const newTransfer: Transfer = {
      id: `VIR-00${transfers.length + 1}`,
      fromId, toId, amount, currency: newCurrency,
      date: new Date().toLocaleDateString('fr-FR', {day:'2-digit', month:'short', year:'numeric'}),
      status: result.success ? 'completed' : 'failed',
      note: newNote || 'Aucune note',
      errorMsg: result.error,
    };
    setTransfers([newTransfer, ...transfers]);
    refreshWallets();

    if (!result.success) {
      setFormError(result.error || 'Erreur.');
      return;
    }
    setShowNewModal(false);
    setNewAmount(''); setNewNote('');
  };

  const agentAccounts = Object.entries(ACCOUNTS).filter(([id, _]) => id !== currentAgentId && id !== 'admin') as [AccountId, any][];
  const agentLabel = (id: AccountId) => ACCOUNTS[id]?.label ?? id;
  const roleIcon = (role: 'agent' | 'admin') =>
    role === 'admin'
      ? <div style={{background:'#f3e8ff', borderRadius:'50%', padding:4, display:'inline-flex'}}><Building2 size={13} color="#7e22ce"/></div>
      : <div style={{background:'#eff6ff', borderRadius:'50%', padding:4, display:'inline-flex'}}><User size={13} color="#2563eb"/></div>;

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Virements Internes</h1>
          <p className={styles.pageSubtitle}>Transferts de fonds entre agents et/ou l&apos;administration.</p>
        </div>
        <button className={styles.primaryButton} onClick={() => { setFormError(''); setShowNewModal(true); }}>
          <Plus size={18} /> Nouveau virement
        </button>
      </div>

      {/* Soldes */}
      {wallets && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14, marginBottom:20}}>
          {(['agent_matam', 'admin'] as AccountId[]).map(id => (
            <div key={id} className={styles.kpiCard} style={{background: id === 'admin' ? '#faf5ff' : 'white'}}>
              <div className={styles.kpiHeader}>
                <p className={styles.kpiTitle}>{ACCOUNTS[id].label}</p>
                <div className={styles.kpiIcon} style={{background: id === 'admin' ? '#f3e8ff' : '#eff6ff'}}>
                  {id === 'admin' ? <Building2 size={16} color="#7e22ce"/> : <User size={16} color="#2563eb"/>}
                </div>
              </div>
              <p className={styles.kpiValue} style={{fontSize:16}}>{formatBalance(wallets[id].USD, 'USD')}</p>
              <p className={styles.kpiTrend}>{wallets[id].GNF.toLocaleString('fr-FR')} GNF</p>
            </div>
          ))}
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <p className={styles.kpiTitle}>Virements ce mois</p>
              <div className={styles.kpiIcon} style={{background:'#dcfce7'}}><ArrowRightLeft size={16} color="#16a34a"/></div>
            </div>
            <p className={styles.kpiValue}>{transfers.filter(t => t.status === 'completed').length}</p>
            <p className={styles.kpiTrend}>Effectués</p>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Rechercher un virement..." className={styles.searchInput} />
          </div>
          <button className={styles.secondaryButton}><Filter size={18} /> Filtrer</button>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th><th>De</th><th>À</th><th>Montant</th><th>Date</th><th>Statut</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.id}</strong></td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                      {roleIcon(ACCOUNTS[t.fromId].role)}
                      <span style={{fontSize:13}}>{agentLabel(t.fromId)}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                      {roleIcon(ACCOUNTS[t.toId].role)}
                      <span style={{fontSize:13}}>{agentLabel(t.toId)}</span>
                    </div>
                  </td>
                  <td style={{fontWeight:700}}>{formatBalance(t.amount, t.currency)}</td>
                  <td>{t.date}</td>
                  <td>
                    {t.status === 'completed' && <span className={`${styles.badge} ${styles.badgeSuccess}`}><CheckCircle size={13}/> Effectué</span>}
                    {t.status === 'pending' && <span className={`${styles.badge} ${styles.badgeWarning}`}><Clock size={13}/> En attente</span>}
                    {t.status === 'failed' && <span className={`${styles.badge} ${styles.badgeError}`}><XCircle size={13}/> Refusé</span>}
                  </td>
                  <td><button className={styles.textButton} onClick={() => setSelectedTransfer(t)}>Voir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Détails */}
      {selectedTransfer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{selectedTransfer.id}</h2>
              <button className={styles.closeButton} onClick={() => setSelectedTransfer(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.infoList}>
                <div className={styles.infoItem}><Send size={15}/><span className={styles.infoLabel}>De</span><span className={styles.infoValue}>{agentLabel(selectedTransfer.fromId)}</span></div>
                <div className={styles.infoItem}><ArrowRightLeft size={15}/><span className={styles.infoLabel}>À</span><span className={styles.infoValue}>{agentLabel(selectedTransfer.toId)}</span></div>
                <div className={styles.infoItem}><DollarSign size={15}/><span className={styles.infoLabel}>Montant</span><span className={styles.infoValue} style={{fontWeight:700, color:'#2563eb', fontSize:18}}>{formatBalance(selectedTransfer.amount, selectedTransfer.currency)}</span></div>
                <div className={styles.infoItem}><FileText size={15}/><span className={styles.infoLabel}>Note</span><span className={styles.infoValue}>{selectedTransfer.note}</span></div>
                {selectedTransfer.errorMsg && <div style={{padding:'10px 12px', background:'#fef2f2', borderRadius:8, color:'#b91c1c', fontSize:13}}>{selectedTransfer.errorMsg}</div>}
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
              <h2>Nouveau Virement</h2>
              <button className={styles.closeButton} onClick={() => setShowNewModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              {/* Solde actuel */}
              {wallets && (
                <div style={{background:'#f8fafc', borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', marginBottom:4}}>
                  <span style={{fontSize:13, color:'#64748b'}}>Mon solde actuel</span>
                  <span style={{fontWeight:700, color:'#0f172a', fontSize:13}}>
                    {formatBalance(wallets[currentAgentId].USD, 'USD')} | {wallets[currentAgentId].GNF.toLocaleString('fr-FR')} GNF
                  </span>
                </div>
              )}

              {/* Direction */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Type de virement</label>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                  {[
                    { key: 'agent_to_admin', label: 'Agent → Admin', icon: <User size={17}/>, color:'#2563eb', bg:'#eff6ff' },
                    { key: 'agent_to_agent', label: 'Agent → Agent', icon: <Users size={17}/>, color:'#059669', bg:'#ecfdf5' },
                  ].map(opt => (
                    <button key={opt.key} type="button" onClick={() => setDirection(opt.key as any)}
                      style={{
                        padding:'12px 6px', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:12,
                        border: direction === opt.key ? `2px solid ${opt.color}` : '2px solid #e2e8f0',
                        background: direction === opt.key ? opt.bg : 'white',
                        color: direction === opt.key ? opt.color : '#64748b',
                        display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all 0.2s'
                      }}>
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destinataire */}
              {direction === 'agent_to_agent' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Agent destinataire</label>
                  <select className={styles.input} value={targetAccountId} onChange={e => setTargetAccountId(e.target.value as AccountId)}>
                    {agentAccounts.map(([id, acc]) => (
                      <option key={id} value={id}>{acc.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Montant</label>
                  <input type="number" className={styles.input} placeholder="Ex: 500" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Devise</label>
                  <select className={styles.input} value={newCurrency} onChange={e => setNewCurrency(e.target.value as 'USD'|'GNF')}>
                    <option value="USD">USD</option>
                    <option value="GNF">GNF</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Note / Motif</label>
                <input type="text" className={styles.input} placeholder="Ex: Collecte semaine, renflement caisse..." value={newNote} onChange={e => setNewNote(e.target.value)} />
              </div>

              {formError && <div style={{padding:'10px 12px', background:'#fef2f2', borderRadius:8, color:'#b91c1c', fontSize:13, borderLeft:'3px solid #ef4444'}}>{formError}</div>}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={() => setShowNewModal(false)}>Annuler</button>
              <button className={styles.primaryButton} onClick={handleSubmit}>
                <Send size={16}/> Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
