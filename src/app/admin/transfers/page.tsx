"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from '../operations.module.css';
import { 
  ArrowRightLeft, Search, Plus, CheckCircle, Clock, 
  XCircle, Send, Building2, User, Wallet, FileText,
  Printer, RefreshCw, Eye
} from 'lucide-react';
import { getShipments } from '@/actions/shipments';
import { getAllTransfers, createAgentTransfer, TransferItem } from '@/actions/transfers';

const AGENCIES = [
  'Administration TANGALY (Siège)',
  'Hub New York (USA)',
  'Agence Conakry (Madina)',
  'Agence Matam',
  'Agence Labé',
  'Agence Kindia',
  'Agence Mamou'
];

interface ShipmentItem {
  id: string;
  amountPaid?: number | null;
}

export default function AdminTransfersPage() {
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);

  // Filtre et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'pending' | 'failed'>('ALL');

  // Form state
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'GNF'>('USD');
  const [newNote, setNewNote] = useState('');
  const [sourceAgency, setSourceAgency] = useState<string>('Administration TANGALY (Siège)');
  const [targetAgency, setTargetAgency] = useState<string>('Agence Conakry (Madina)');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch real shipments to get global collected cash
  useEffect(() => {
    let active = true;
    getShipments()
      .then((res) => {
        if (active && res.success && res.data) {
          setShipments(res.data as ShipmentItem[]);
        }
      })
      .catch((err) => {
        console.error("Erreur chargement expéditions:", err);
      })
      .finally(() => {
        if (active) setLoadingShipments(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // 2. Load all transfers from server and localStorage
  const loadAllTransfersData = useCallback(async () => {
    setLoadingTransfers(true);
    try {
      const res = await getAllTransfers();
      let serverTransfers = (res.success && res.data) ? res.data : [];

      // Sync localStorage items if any
      try {
        const localRaw = localStorage.getItem('tangaly_internal_transfers');
        if (localRaw) {
          const localList: Array<{ id: string; fromName?: string; amount: number; currency?: 'USD' | 'GNF'; note?: string; toName?: string }> = JSON.parse(localRaw);
          for (const localT of localList) {
            const already = serverTransfers.some(st => st.id === localT.id || st.reference === localT.id);
            if (!already && localT.amount > 0) {
              const syncRes = await createAgentTransfer({
                amount: localT.amount,
                currency: localT.currency || 'USD',
                note: localT.note,
                toName: localT.toName,
                clientGeneratedId: localT.id,
              });
              if (syncRes.success && syncRes.data) {
                serverTransfers = [syncRes.data as TransferItem, ...serverTransfers];
              }
            }
          }
        }
      } catch (storageErr) {
        console.warn("Storage sync warning:", storageErr);
      }

      setTransfers(serverTransfers);
    } catch (err) {
      console.error("Erreur chargement transferts admin:", err);
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    getAllTransfers()
      .then((res) => {
        if (!isSubscribed) return;
        const serverList = (res.success && res.data) ? res.data : [];
        setTransfers(serverList);
      })
      .catch((err) => {
        console.error("Erreur chargement transferts admin:", err);
      })
      .finally(() => {
        if (isSubscribed) setLoadingTransfers(false);
      });
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Metrics
  const totalCollectedUSD = shipments.reduce((sum, s) => sum + (Number(s.amountPaid) || 0), 0);
  
  const totalTransfersToAdminUSD = transfers
    .filter(t => t.toName.includes('Administration') && t.status === 'completed' && t.currency === 'USD')
    .reduce((sum, t) => sum + t.amount, 0);

  const baseAdminUSD = 10000;
  const currentAdminUSD = baseAdminUSD + totalTransfersToAdminUSD;

  // Filtrage
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const refMatch = (t.reference || t.id || '').toLowerCase().includes(query);
        const fromMatch = (t.fromName || '').toLowerCase().includes(query);
        const toMatch = (t.toName || '').toLowerCase().includes(query);
        const noteMatch = (t.note || '').toLowerCase().includes(query);
        const amountMatch = t.amount.toString().includes(query);
        return refMatch || fromMatch || toMatch || noteMatch || amountMatch;
      }
      return true;
    });
  }, [transfers, statusFilter, searchQuery]);

  const handleSubmit = async () => {
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

    setIsSubmitting(true);
    try {
      const generatedRef = `VIR-${Date.now().toString().slice(-4)}`;
      const res = await createAgentTransfer({
        amount,
        currency: newCurrency,
        note: newNote || 'Transfert de fonds validé par l\'Administration',
        toName: targetAgency,
        clientGeneratedId: generatedRef,
      });

      if (res.success && res.data) {
        const newTransferItem: TransferItem = res.data as TransferItem;
        const updatedList = [newTransferItem, ...transfers];
        setTransfers(updatedList);
        try {
          localStorage.setItem('tangaly_internal_transfers', JSON.stringify(updatedList));
        } catch {
          // ignore localStorage error
        }

        setShowNewModal(false);
        setNewAmount('');
        setNewNote('');
        setSelectedTransfer(newTransferItem);
      } else {
        setFormError(res.message || 'Erreur lors de l\'enregistrement.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau inattendue.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatBalance = (amount: number, currency: 'USD' | 'GNF') => {
    if (currency === 'USD') return `$${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${amount.toLocaleString('fr-FR')} GNF`;
  };

  const handlePrintReceipt = (t: TransferItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu de Virement - ${t.reference || t.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; background: white; }
          .receipt-box { max-width: 650px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 12px; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 1px; }
          .logo-sub { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; }
          .badge { background: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; border: 1px solid #bbf7d0; }
          .title { font-size: 18px; font-weight: 700; margin: 0 0 4px; color: #0f172a; }
          .subtitle { font-size: 13px; color: #64748b; margin: 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .field-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
          .field-value { font-size: 14px; font-weight: 600; color: #0f172a; }
          .amount-box { text-align: center; background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .amount-label { font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .amount-val { font-size: 32px; font-weight: 900; color: #1e3a8a; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .signature-box { text-align: center; border-top: 1px dashed #94a3b8; width: 180px; padding-top: 8px; font-size: 12px; color: #64748b; font-weight: 600; }
          .stamp { border: 2px solid #16a34a; color: #16a34a; font-weight: 800; font-size: 13px; padding: 8px 16px; border-radius: 6px; text-transform: uppercase; letter-spacing: 2px; transform: rotate(-5deg); display: inline-block; }
          @media print {
            body { padding: 0; }
            .receipt-box { border: none; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div>
              <div class="logo">TANGALY</div>
              <div class="logo-sub">Shipping & Logistics Express</div>
            </div>
            <div class="badge">VIREMENT CENTRAL ENREGISTRÉ</div>
          </div>

          <h1 class="title">Bordereau Officiel de Trésorerie</h1>
          <p class="subtitle">Suivi central des transferts inter-agences et versements des caisses</p>

          <div class="grid">
            <div>
              <div class="field-label">N° de Référence</div>
              <div class="field-value">${t.reference || t.id}</div>
            </div>
            <div>
              <div class="field-label">Date & Heure</div>
              <div class="field-value">${t.date}</div>
            </div>
            <div>
              <div class="field-label">Agence Émettrice</div>
              <div class="field-value">${t.fromName}</div>
            </div>
            <div>
              <div class="field-label">Agence Destinataire</div>
              <div class="field-value">${t.toName}</div>
            </div>
          </div>

          <div class="amount-box">
            <div class="amount-label">Montant de la Transaction</div>
            <div class="amount-val">${formatBalance(t.amount, t.currency)}</div>
          </div>

          <div style="background: #fafafa; border: 1px solid #f1f5f9; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #475569;">
            <strong>Motif / Observation :</strong> ${t.note || 'Opération de trésorerie centrale.'}
          </div>

          <div class="footer">
            <div>
              <div class="stamp">VALIDÉ ADMINISTRATION</div>
              <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0;">Certifié conforme par la Direction Tangaly</p>
            </div>
            <div class="signature-box">
              Direction Financière
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Virements & Trésorerie Centrale
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Supervision de tous les versements de caisse reçus des agences et transferts inter-agences.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => loadAllTransfersData(true)} 
            title="Rafraîchir les données"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', 
              borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' 
            }}
          >
            <RefreshCw size={15} className={loadingTransfers ? 'animate-spin' : ''} /> Actualiser
          </button>
          <button 
            type="button"
            className={styles.primaryButton} 
            onClick={() => { setFormError(''); setShowNewModal(true); }}
            style={{ padding: '9px 18px', fontSize: 14 }}
          >
            <Plus size={18} /> Nouveau virement
          </button>
        </div>
      </div>

      {/* KPI Cards connectées */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {/* Carte 1 : Trésorerie Siège */}
        <div style={{ background: '#faf5ff', border: '1.5px solid #f3e8ff', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#7e22ce' }}>Trésorerie Centrale (Siège)</span>
            <div style={{ background: '#f3e8ff', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#7e22ce" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#7e22ce', marginBottom: 6 }}>
            ${currentAdminUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: '#9333ea', fontWeight: 500 }}>
            Versements reçus de toutes les agences : <strong>+${totalTransfersToAdminUSD.toFixed(2)}</strong>
          </div>
        </div>

        {/* Carte 2 : Total collecté réseau */}
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Total Collecté Réseau (Colis)</span>
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {loadingShipments ? '...' : `$${totalCollectedUSD.toFixed(2)}`}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {shipments.length} expéditions enregistrées au total
          </div>
        </div>

        {/* Carte 3 : Total virements */}
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Total Opérations Réseau</span>
            <div style={{ background: '#dcfce7', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightLeft size={16} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginBottom: 6 }}>
            {transfers.filter(t => t.status === 'completed').length}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
            Versements & transferts validés
          </div>
        </div>
      </div>

      {/* Tableau des virements */}
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ 
          padding: '14px 18px', 
          borderBottom: '1px solid #e2e8f0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 12,
          background: '#ffffff'
        }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Rechercher par référence, agence, motif..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'completed' | 'pending' | 'failed')}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                background: '#ffffff',
                cursor: 'pointer',
                outline: 'none',
                fontWeight: 500
              }}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="completed">Effectués / Validés</option>
              <option value="pending">En attente</option>
              <option value="failed">Refusés</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Réf</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Source / Expéditeur</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Bénéficiaire</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Montant</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Motif</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingTransfers ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={24} className="animate-spin" color="#3b82f6" />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Chargement des données de trésorerie...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '44px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <ArrowRightLeft size={30} color="#94a3b8" />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Aucune opération trouvée.</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                        Les versements enregistrés par les agents s&apos;afficheront ici automatiquement.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 12, border: '1px solid #e2e8f0' }}>
                        {t.reference || t.id}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: t.fromName.includes('Administration') ? '#f3e8ff' : '#eff6ff', borderRadius: '50%', padding: 4, display: 'inline-flex' }}>
                          {t.fromName.includes('Administration') ? <Building2 size={13} color="#7e22ce" /> : <User size={13} color="#2563eb" />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.fromName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: t.toName.includes('Administration') ? '#f3e8ff' : '#eff6ff', borderRadius: '50%', padding: 4, display: 'inline-flex' }}>
                          {t.toName.includes('Administration') ? <Building2 size={13} color="#7e22ce" /> : <User size={13} color="#2563eb" />}
                        </div>
                        <span style={{ fontSize: 13, color: '#581c87', fontWeight: 500 }}>{t.toName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#0f172a', fontSize: 14, whiteSpace: 'nowrap' }}>
                      {formatBalance(t.amount, t.currency)}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {t.date}
                    </td>
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      {t.status === 'completed' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          <CheckCircle size={13}/> Effectué
                        </span>
                      )}
                      {t.status === 'pending' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          <Clock size={13}/> En attente
                        </span>
                      )}
                      {t.status === 'failed' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          <XCircle size={13}/> Refusé
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 12, color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.note}>
                      {t.note}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button 
                          type="button"
                          onClick={() => setSelectedTransfer(t)}
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Eye size={13} /> Reçu
                        </button>
                        <button 
                          type="button"
                          onClick={() => handlePrintReceipt(t)}
                          style={{
                            background: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                          title="Imprimer le reçu"
                        >
                          <Printer size={13} />
                        </button>
                      </div>
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
          <div className={styles.modalContent} style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>Reçu de Virement {selectedTransfer.reference || selectedTransfer.id}</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>Bordereau officiel d&apos;opération de trésorerie</p>
              </div>
              <button className={styles.closeButton} onClick={() => setSelectedTransfer(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: 10, border: '1.5px dashed #cbd5e1', marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Montant de l&apos;Opération</span>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                  {formatBalance(selectedTransfer.amount, selectedTransfer.currency)}
                </div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                    TRANSACTION VALIDÉE
                  </span>
                </div>
              </div>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <Send size={15}/>
                  <span className={styles.infoLabel}>Source</span>
                  <span className={styles.infoValue}>{selectedTransfer.fromName}</span>
                </div>
                <div className={styles.infoItem}>
                  <ArrowRightLeft size={15}/>
                  <span className={styles.infoLabel}>Bénéficiaire</span>
                  <span className={styles.infoValue}>{selectedTransfer.toName}</span>
                </div>
                <div className={styles.infoItem}>
                  <Clock size={15}/>
                  <span className={styles.infoLabel}>Date</span>
                  <span className={styles.infoValue}>{selectedTransfer.date}</span>
                </div>
                <div className={styles.infoItem}>
                  <FileText size={15}/>
                  <span className={styles.infoLabel}>Motif</span>
                  <span className={styles.infoValue}>{selectedTransfer.note}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className={styles.secondaryButton} onClick={() => setSelectedTransfer(null)}>Fermer</button>
              <button 
                type="button" 
                className={styles.primaryButton} 
                onClick={() => handlePrintReceipt(selectedTransfer)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={16} /> Imprimer le reçu officiel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Virement Central */}
      {showNewModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 500 }}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>Nouveau Virement Inter-Agences</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>Transfert de trésorerie validé par le Siège</p>
              </div>
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
                  {AGENCIES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Montant</label>
                  <input 
                    type="number" 
                    step="any"
                    className={styles.input} 
                    placeholder="Ex: 5000" 
                    value={newAmount} 
                    onChange={e => setNewAmount(e.target.value)} 
                    autoFocus
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
                <label className={styles.label}>Motif / Référence interne</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ex: Approvisionnement de caisse agence..." 
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
              <button 
                type="button" 
                className={styles.secondaryButton} 
                onClick={() => setShowNewModal(false)}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className={styles.primaryButton} 
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={16}/> {isSubmitting ? 'Validation...' : 'Valider le virement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
