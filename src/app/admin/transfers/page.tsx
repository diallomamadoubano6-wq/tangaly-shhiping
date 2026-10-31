"use client";

import React, { useState, useEffect, useMemo } from 'react';
import styles from '../operations.module.css';
import { 
  ArrowRightLeft, Search, CheckCircle, Clock, 
  XCircle, Send, Building2, User, Wallet, FileText,
  Printer, RefreshCw, Eye, Check, X, AlertCircle
} from 'lucide-react';
import { getShipments } from '@/actions/shipments';
import { getAllTransfers, validateRemittance, TransferItem } from '@/actions/transfers';

interface ShipmentItem {
  id: string;
  amountPaid?: number | null;
}

export default function AdminTransfersPage() {
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtre et recherche
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'pending' | 'completed' | 'failed'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'USD' | 'GNF'>('ALL');

  // 1. Charger les expéditions réelles
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

  // 2. Charger tous les versements reçus des agents
  const loadTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const res = await getAllTransfers();
      if (res.success && res.data) {
        setTransfers(res.data);
      }
    } catch (err) {
      console.error("Erreur chargement transferts admin:", err);
    } finally {
      setLoadingTransfers(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  // Action de validation par l'administrateur
  const handleValidate = async (t: TransferItem, status: 'VALIDATED' | 'REJECTED') => {
    setActionLoadingId(t.id);
    setToastMsg(null);
    try {
      const res = await validateRemittance(t.reference || t.id, status);
      if (res.success) {
        setToastMsg({ 
          type: 'success', 
          text: status === 'VALIDATED' 
            ? `Versement ${t.reference} validé et encaissé avec succès !` 
            : `Versement ${t.reference} marqué comme refusé.` 
        });
        await loadTransfers();
        if (selectedTransfer && (selectedTransfer.id === t.id || selectedTransfer.reference === t.reference)) {
          setSelectedTransfer({
            ...selectedTransfer,
            status: status === 'VALIDATED' ? 'completed' : 'failed',
          });
        }
      } else {
        setToastMsg({ type: 'error', text: res.message || 'Erreur lors de la validation.' });
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Erreur inattendue.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // KPIs
  const totalReceivedUSD = transfers
    .filter(t => t.status === 'completed' && t.currency === 'USD')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReceivedGNF = transfers
    .filter(t => t.status === 'completed' && t.currency === 'GNF')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTransfers = transfers.filter(t => t.status === 'pending');
  const pendingCount = pendingTransfers.length;
  const pendingAmountUSD = pendingTransfers.filter(t => t.currency === 'USD').reduce((sum, t) => sum + t.amount, 0);

  // Filtrage
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (currencyFilter !== 'ALL' && t.currency !== currencyFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const refMatch = (t.reference || t.id || '').toLowerCase().includes(query);
        const fromMatch = (t.fromName || '').toLowerCase().includes(query);
        const toMatch = (t.toName || '').toLowerCase().includes(query);
        const noteMatch = (t.note || '').toLowerCase().includes(query);
        const amountMatch = t.amount.toString().includes(query);
        const dateMatch = (t.date || '').toLowerCase().includes(query);
        return refMatch || fromMatch || toMatch || noteMatch || amountMatch || dateMatch;
      }
      return true;
    });
  }, [transfers, statusFilter, currencyFilter, searchQuery]);

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
        <title>Reçu Officiel de Versement - ${t.reference || t.id}</title>
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
            <div class="badge">${t.status === 'completed' ? 'VERSEMENT VALIDÉ & ENCAISSÉ' : 'VERSEMENT TRANSMIS'}</div>
          </div>

          <h1 class="title">Bordereau Officiel de Versement de Caisse</h1>
          <p class="subtitle">Justificatif officiel d'encaissement au Siège de l'Administration Centrale TANGALY</p>

          <div class="grid">
            <div>
              <div class="field-label">N° de Référence</div>
              <div class="field-value">${t.reference || t.id}</div>
            </div>
            <div>
              <div class="field-label">Date & Heure d'Enregistrement</div>
              <div class="field-value">${t.date}</div>
            </div>
            <div>
              <div class="field-label">Agent Déposant (Source)</div>
              <div class="field-value">${t.fromName}</div>
            </div>
            <div>
              <div class="field-label">Bénéficiaire (Récepteur)</div>
              <div class="field-value">${t.toName}</div>
            </div>
          </div>

          <div class="amount-box">
            <div class="amount-label">Montant Total Reversé</div>
            <div class="amount-val">${formatBalance(t.amount, t.currency)}</div>
          </div>

          <div style="background: #fafafa; border: 1px solid #f1f5f9; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #475569;">
            <strong>Motif / Observation :</strong> ${t.note || 'Versement des fonds de caisse collectés sur les expéditions.'}
          </div>

          <div class="footer">
            <div>
              <div class="stamp">ENCAISSÉ AU SIÈGE</div>
              <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0;">Transaction certifiée conforme par l'Administration Tangaly</p>
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
      {/* Toast de notification */}
      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 8,
          background: toastMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${toastMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: toastMsg.type === 'success' ? '#15803d' : '#b91c1c',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {toastMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{toastMsg.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMsg(null)} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            Historique des Versements Reçus des Agents
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Supervision et validation de tous les reversements de caisse effectués par les agents vers le Siège de l&apos;Administration.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => loadTransfers()} 
            title="Rafraîchir les données"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', 
              borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' 
            }}
          >
            <RefreshCw size={15} className={loadingTransfers ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {/* Total Validé USD */}
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Total Encaissé Siège (USD)</span>
            <div style={{ background: '#f3e8ff', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#7e22ce" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#7e22ce', marginBottom: 6 }}>
            ${totalReceivedUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: '#9333ea', fontWeight: 500 }}>
            Fonds validés reçus des agents en dollars
          </div>
        </div>

        {/* Total Validé GNF */}
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Total Encaissé Siège (GNF)</span>
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            {totalReceivedGNF.toLocaleString('fr-FR')} GNF
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Fonds validés reçus des agents en francs guinéens
          </div>
        </div>

        {/* En attente de validation */}
        <div style={{ 
          background: pendingCount > 0 ? '#fffbeb' : '#ffffff', 
          border: `1.5px solid ${pendingCount > 0 ? '#fde68a' : '#e2e8f0'}`, 
          borderRadius: 12, 
          padding: 18, 
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: pendingCount > 0 ? '#b45309' : '#475569' }}>
              En Attente de Validation
            </span>
            <div style={{ background: pendingCount > 0 ? '#fef3c7' : '#f1f5f9', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color={pendingCount > 0 ? '#d97706' : '#64748b'} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: pendingCount > 0 ? '#b45309' : '#0f172a', marginBottom: 6 }}>
            {pendingCount} versement{pendingCount > 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 12, color: pendingCount > 0 ? '#b45309' : '#64748b', fontWeight: 500 }}>
            {pendingCount > 0 ? `Montant en attente : $${pendingAmountUSD.toFixed(2)} USD` : 'Toutes les remises ont été traitées'}
          </div>
        </div>

        {/* Total opérations */}
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Total Versements Transmis</span>
            <div style={{ background: '#dcfce7', borderRadius: 8, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightLeft size={16} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', marginBottom: 6 }}>
            {transfers.length}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
            Historique complet des agents
          </div>
        </div>
      </div>

      {/* Tableau des versements */}
      <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        {/* Barre d'outils */}
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
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 420 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Rechercher par référence, nom de l'agent, agence..." 
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Statut :</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
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
                <option value="pending">En attente de validation</option>
                <option value="completed">Validés / Encaissés</option>
                <option value="failed">Refusés</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Devise :</span>
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value as any)}
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
                <option value="ALL">Toutes devises</option>
                <option value="USD">USD ($)</option>
                <option value="GNF">GNF</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 780 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Réf. Versement</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Agent Déposant (Source)</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Bénéficiaire</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Montant Versé</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Statut</th>
                <th style={{ padding: '14px 18px', fontWeight: 700 }}>Observation</th>
                <th style={{ padding: '14px 18px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingTransfers ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={24} className="animate-spin" color="#3b82f6" />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>Chargement des versements...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '44px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <ArrowRightLeft size={30} color="#94a3b8" />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Aucun versement d&apos;agent trouvé.</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                        Dès qu&apos;un agent enregistre un versement de sa caisse vers l&apos;Administration, il apparaîtra ici avec son statut.
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
                        <div style={{ background: '#eff6ff', borderRadius: '50%', padding: 4, display: 'inline-flex' }}>
                          <User size={13} color="#2563eb" />
                        </div>
                        <div>
                          <strong style={{ fontSize: 13, color: '#1e293b', display: 'block' }}>{t.fromName}</strong>
                          {t.agentEmail && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{t.agentEmail}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ background: '#f3e8ff', borderRadius: '50%', padding: 4, display: 'inline-flex' }}>
                          <Building2 size={13} color="#7e22ce" />
                        </div>
                        <span style={{ fontSize: 13, color: '#581c87', fontWeight: 600 }}>{t.toName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 800, color: '#16a34a', fontSize: 15, whiteSpace: 'nowrap' }}>
                      +{formatBalance(t.amount, t.currency)}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {t.date}
                    </td>
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      {t.status === 'completed' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          <CheckCircle size={13}/> Encaissé au Siège
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
                    <td style={{ padding: '14px 18px', fontSize: 12, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.note}>
                      {t.note}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        {/* Bouton rapide de validation si en attente */}
                        {t.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleValidate(t, 'VALIDATED')}
                            disabled={actionLoadingId === t.id}
                            style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '5px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            title="Valider la réception de ce versement"
                          >
                            <Check size={13} /> {actionLoadingId === t.id ? 'Validation...' : 'Valider'}
                          </button>
                        )}
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
                          title="Imprimer le bordereau officiel"
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

      {/* Modal Détails & Reçu de Versement */}
      {selectedTransfer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>
                  Bordereau de Versement {selectedTransfer.reference || selectedTransfer.id}
                </h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0 0' }}>
                  Justificatif officiel d&apos;encaissement par l&apos;Administration TANGALY
                </p>
              </div>
              <button className={styles.closeButton} onClick={() => setSelectedTransfer(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: 10, border: '1.5px dashed #cbd5e1', marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Montant du Versement</span>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
                  +{formatBalance(selectedTransfer.amount, selectedTransfer.currency)}
                </div>
                <div style={{ marginTop: 6 }}>
                  {selectedTransfer.status === 'completed' ? (
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                      ENCAISSÉ & VALIDÉ PAR L&apos;ADMINISTRATION
                    </span>
                  ) : selectedTransfer.status === 'pending' ? (
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                      EN ATTENTE DE VALIDATION
                    </span>
                  ) : (
                    <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                      REFUSÉ
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <User size={15}/>
                  <span className={styles.infoLabel}>Agent Déposant</span>
                  <span className={styles.infoValue}>{selectedTransfer.fromName}</span>
                </div>
                <div className={styles.infoItem}>
                  <Building2 size={15}/>
                  <span className={styles.infoLabel}>Bénéficiaire</span>
                  <span className={styles.infoValue}>{selectedTransfer.toName}</span>
                </div>
                <div className={styles.infoItem}>
                  <Clock size={15}/>
                  <span className={styles.infoLabel}>Date d&apos;émission</span>
                  <span className={styles.infoValue}>{selectedTransfer.date}</span>
                </div>
                <div className={styles.infoItem}>
                  <FileText size={15}/>
                  <span className={styles.infoLabel}>Observation / Motif</span>
                  <span className={styles.infoValue}>{selectedTransfer.note}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <button 
                type="button" 
                className={styles.secondaryButton} 
                onClick={() => setSelectedTransfer(null)}
              >
                Fermer
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedTransfer.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleValidate(selectedTransfer, 'VALIDATED')}
                    disabled={actionLoadingId === selectedTransfer.id}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Check size={16} /> Valider l&apos;encaissement
                  </button>
                )}
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
        </div>
      )}
    </div>
  );
}
