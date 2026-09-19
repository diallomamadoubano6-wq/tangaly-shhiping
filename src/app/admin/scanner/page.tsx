'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Camera, CameraOff, Search, ArrowRight, Package, CheckCircle2, 
  Loader2, ScanBarcode, Clock, MapPin, User, Weight, 
  ExternalLink, Volume2, VolumeX, Sparkles, AlertCircle, 
  RotateCw, Check, Copy, History, Trash2, Zap, Barcode, Tag
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useToast } from '@/components/ui/ToastProvider';
import { findShipmentByTracking, scanShipmentAction } from '@/actions/shipments';
import { SHIPMENT_STATUSES, getStatusInfo } from '@/lib/trackingStatuses';
import styles from './scanner.module.css';

interface ScannedHistoryItem {
  tracking_number: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  clientName?: string;
}

export default function AdminScannerPage() {
  const { addToast } = useToast();

  // Mode state
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Search & input
  const [trackingInput, setTrackingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Result state
  const [shipment, setShipment] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Update form state
  const [targetStatus, setTargetStatus] = useState<string>('RECEIVED');
  const [locationNote, setLocationNote] = useState('Hub Central Conakry');
  const [commentNote, setCommentNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Session History
  const [history, setHistory] = useState<ScannedHistoryItem[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  // Audio tone generator for scan feedback
  const playScanBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([45, 30, 90]);
      }
    } catch (e) {
      // Audio context restricted by browser
    }
  };

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tangaly_scanner_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        setTodayCount(parsed.length);
      }
    } catch (e) {}
  }, []);

  // Save history to localStorage
  const saveHistoryItem = (item: ScannedHistoryItem) => {
    const updated = [item, ...history.filter(h => h.tracking_number !== item.tracking_number)].slice(0, 10);
    setHistory(updated);
    setTodayCount(prev => prev + 1);
    try {
      localStorage.setItem('tangaly_scanner_history', JSON.stringify(updated));
    } catch (e) {}
  };

  // Determine logical next status
  const suggestNextStatus = (currentStatut: string) => {
    switch (currentStatut) {
      case 'CREATED': return 'RECEIVED';
      case 'RECEIVED': return 'PREPARING';
      case 'PREPARING': return 'SHIPPED';
      case 'SHIPPED': return 'ARRIVED';
      case 'ARRIVED': return 'DELIVERED';
      default: return 'RECEIVED';
    }
  };

  // Search parcel by tracking number
  const handleLookup = async (codeToSearch: string) => {
    const code = codeToSearch.trim();
    if (!code) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await findShipmentByTracking(code);
      if (res.success && res.data) {
        playScanBeep();
        setShipment(res.data);
        setTargetStatus(suggestNextStatus(res.data.statut));
        setTrackingInput(code);
        addToast('info', 'Colis détecté', `N° ${code} chargé avec succès.`);
      } else {
        setError(res.message || `Colis "${code}" introuvable.`);
        setShipment(null);
        addToast('error', 'Non trouvé', res.message || 'Colis introuvable');
      }
    } catch (err: any) {
      setError('Erreur technique lors de la recherche.');
      addToast('error', 'Erreur', 'Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // Handle submit manual search form
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLookup(trackingInput);
  };

  // Confirm status update
  const handleConfirmStatus = async () => {
    if (!shipment?.tracking_number) return;

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await scanShipmentAction(
        shipment.tracking_number,
        targetStatus,
        commentNote || undefined,
        locationNote || undefined
      );

      if (res.success && res.data) {
        playScanBeep();
        const prev = shipment.statut;
        setShipment(res.data);
        setSuccessMsg(`Statut actualisé avec succès vers "${getStatusInfo(targetStatus).labelFr}" !`);
        addToast('success', 'Pointage validé', `Colis ${shipment.tracking_number} passé à "${targetStatus}"`);

        saveHistoryItem({
          tracking_number: shipment.tracking_number,
          previousStatus: prev,
          newStatus: targetStatus,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          clientName: shipment.client?.user?.nom || 'Client'
        });

        setCommentNote('');
      } else {
        setError(res.message || 'Impossible de mettre à jour le statut.');
        addToast('error', 'Erreur', res.message || 'Mise à jour échouée');
      }
    } catch (err: any) {
      setError('Erreur technique lors de la validation.');
      addToast('error', 'Erreur', 'Erreur serveur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      addToast('info', 'Copié', 'Numéro de suivi copié dans le presse-papiers');
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('tangaly_scanner_history');
    } catch (e) {}
    addToast('info', 'Historique vidé', 'Le journal local des scans a été réinitialisé.');
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <ScanBarcode size={26} color="#2563eb" />
            Scanner & Pointage des Colis
          </h1>
          <p>Scannez le QR Code ou code-barres de l&apos;étiquette pour actualiser les étapes de livraison.</p>
        </div>

        <div className={styles.headerStats}>
          <div className={`${styles.statBadge} ${styles.statBadgePrimary}`}>
            <Clock size={15} />
            Pointés en session : <strong>{todayCount}</strong>
          </div>
          <div className={styles.statBadge}>
            <span className={styles.onlineDot} />
            Mode Direct
          </div>
          <button
            type="button"
            className={styles.statBadge}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Couper le bip sonore" : "Activer le bip sonore"}
            style={{ cursor: 'pointer', border: '1px solid var(--color-border)' }}
          >
            {soundEnabled ? <Volume2 size={15} color="#16a34a" /> : <VolumeX size={15} color="#94a3b8" />}
            <span>{soundEnabled ? 'Son actif' : 'Muet'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column: Scanner & Inputs */}
        <div className={styles.card}>
          {/* Tabs bar */}
          <div className={styles.tabsBar}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'camera' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('camera')}
            >
              <Camera size={18} />
              Caméra en Direct
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'manual' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <Search size={18} />
              Saisie Manuelle
            </button>
          </div>

          <div className={styles.scannerBody}>
            {activeTab === 'camera' ? (
              <div className={styles.viewfinderContainer}>
                {!cameraActive ? (
                  <div className={styles.cameraInactive}>
                    <div className={styles.cameraIconWrap}>
                      <Camera size={34} />
                    </div>
                    <p className={styles.cameraInactiveTitle}>Lecteur optique prêt</p>
                    <p className={styles.cameraInactiveSub}>
                      Activez la caméra pour scanner instantanément les étiquettes QR Code ou codes-barres.
                    </p>
                    <button
                      type="button"
                      className={styles.startCamBtn}
                      onClick={() => setCameraActive(true)}
                    >
                      <Camera size={16} />
                      Activer la caméra
                    </button>
                  </div>
                ) : (
                  <div className={styles.activeCameraWrap}>
                    <Scanner
                      onScan={(detectedCodes: any) => {
                        if (detectedCodes && detectedCodes.length > 0) {
                          const raw = detectedCodes[0].rawValue;
                          if (raw) {
                            handleLookup(raw);
                          }
                        }
                      }}
                      formats={['qr_code', 'code_128', 'ean_13', 'code_39']}
                      constraints={{
                        facingMode: facingMode
                      }}
                      styles={{
                        container: { width: '100%', height: '100%' },
                        video: { width: '100%', height: '100%', objectFit: 'cover' }
                      }}
                    />

                    {/* Animated Scanning Laser */}
                    <div className={styles.laserLine} />

                    {/* Corner Target Reticles */}
                    <div className={styles.reticleFrame}>
                      <div className={styles.cornerTL} />
                      <div className={styles.cornerTR} />
                      <div className={styles.cornerBL} />
                      <div className={styles.cornerBR} />
                    </div>

                    {/* Viewfinder Controls */}
                    <div className={styles.viewfinderControls}>
                      <button
                        type="button"
                        className={styles.viewfinderBtn}
                        onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                        title="Changer de caméra (avant/arrière)"
                      >
                        <RotateCw size={14} />
                        Caméra
                      </button>
                      <button
                        type="button"
                        className={`${styles.viewfinderBtn} ${styles.viewfinderBtnDanger}`}
                        onClick={() => setCameraActive(false)}
                      >
                        <CameraOff size={14} />
                        Désactiver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Manual input section (always accessible or dedicated tab) */}
            <div className={styles.manualSection}>
              <form onSubmit={handleManualSubmit} className={styles.searchBar}>
                <div className={styles.inputWrap}>
                  <Search size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Saisir N° suivi (ex: TGL-2024-...)"
                    className={styles.textInput}
                    autoComplete="off"
                    autoFocus={activeTab === 'manual'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !trackingInput.trim()}
                  className={styles.submitSearchBtn}
                >
                  {loading ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <span>Rechercher</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Supported formats */}
              <div className={styles.formatPills}>
                <span className={styles.formatPill} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Zap size={12} /> QR Code</span>
                <span className={styles.formatPill} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Barcode size={12} /> Code 128</span>
                <span className={styles.formatPill} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Tag size={12} /> EAN-13</span>
                <span className={styles.formatPill} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Search size={12} /> Recherche textuelle</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Result & Update Actions */}
        <div className={styles.card}>
          <div className={styles.resultHeader}>
            <h2 className={styles.resultTitle}>
              <Package size={18} color="#2563eb" />
              Fiche du Colis
            </h2>
            {shipment && (
              <span className={styles.routeBadge}>
                {shipment.type_transport || 'Fret Standard'}
              </span>
            )}
          </div>

          <div className={styles.resultBody}>
            {/* Feedback Banners */}
            {error && (
              <div className={styles.alertError} role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>{error}</div>
              </div>
            )}

            {successMsg && (
              <div className={styles.alertSuccess} role="status">
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>{successMsg}</div>
              </div>
            )}

            {/* Empty State */}
            {!shipment && !loading && !error && (
              <div className={styles.emptyState}>
                <div className={styles.emptyRadar}>
                  <ScanBarcode size={32} />
                </div>
                <p className={styles.emptyTitle}>En attente de scan</p>
                <p className={styles.emptyText}>
                  Positionnez le code dans le viseur de la caméra ou saisissez le numéro de suivi pour afficher les détails du colis et mettre à jour son statut.
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className={styles.emptyState}>
                <Loader2 size={36} color="#2563eb" style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                <p className={styles.emptyTitle}>Interrogation de la base de données...</p>
                <p className={styles.emptyText}>Vérification du numéro de suivi en direct.</p>
              </div>
            )}

            {/* Found Shipment Details & Immediate Actions */}
            {shipment && !loading && (
              <>
                <div className={styles.shipmentDetailsCard}>
                  <div className={styles.shipmentMainInfo}>
                    <div>
                      <div className={styles.trackingTag}>
                        <span>{shipment.tracking_number}</span>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => handleCopy(shipment.tracking_number)}
                          title="Copier le numéro"
                        >
                          {copied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                        </button>
                      </div>
                      <div className={styles.routeBadge}>
                        <MapPin size={13} />
                        {shipment.origine} ➔ {shipment.destination}
                      </div>
                    </div>

                    <span
                      className={styles.historyBadge}
                      style={{
                        backgroundColor: getStatusInfo(shipment.statut).bgColor,
                        color: getStatusInfo(shipment.statut).color,
                        border: `1px solid ${getStatusInfo(shipment.statut).color}30`
                      }}
                    >
                      {getStatusInfo(shipment.statut).labelFr}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Client</span>
                      <span className={styles.infoValue}>
                        {shipment.client?.user?.nom || 'Inconnu'}
                      </span>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Poids</span>
                      <span className={styles.infoValue}>
                        {shipment.poids ? `${shipment.poids} kg` : 'N/D'}
                      </span>
                    </div>

                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Volume / Colis</span>
                      <span className={styles.infoValue}>
                        {shipment.boxes ? `${shipment.boxes} carton(s)` : (shipment.volume ? `${shipment.volume} m³` : '1 colis')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Update Controls */}
                <div className={styles.updateActionBox}>
                  <p className={styles.actionSectionTitle}>Action : Pointer vers le statut</p>

                  <div className={styles.statusSelectorGrid}>
                    {SHIPMENT_STATUSES.map((st) => (
                      <button
                        key={st.code}
                        type="button"
                        onClick={() => setTargetStatus(st.code)}
                        className={`${styles.statusPillBtn} ${targetStatus === st.code ? styles.statusPillSelected : ''}`}
                      >
                        <span>{st.icon}</span>
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className={styles.inputRow}>
                    <label className={styles.fieldLabel}>Localisation actuelle / Agence</label>
                    <input
                      type="text"
                      className={styles.selectInput}
                      value={locationNote}
                      onChange={(e) => setLocationNote(e.target.value)}
                      placeholder="Ex: Hub Conakry, Aéroport JFK, Entrepôt USA..."
                    />
                  </div>

                  <div className={styles.inputRow}>
                    <label className={styles.fieldLabel}>Note ou observation (Optionnel)</label>
                    <input
                      type="text"
                      className={styles.commentInput}
                      value={commentNote}
                      onChange={(e) => setCommentNote(e.target.value)}
                      placeholder="Ex: Colis vérifié, emballage intact..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmStatus}
                    disabled={actionLoading}
                    className={styles.confirmUpdateBtn}
                  >
                    {actionLoading ? (
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Enregistrer le pointage ({getStatusInfo(targetStatus).label})</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Session Scans History */}
      {history.length > 0 && (
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <h3 className={styles.historyTitle}>
              <History size={16} color="#2563eb" />
              Journal des pointages récents ({history.length})
            </h3>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearHistory}
              title="Vider le journal local"
            >
              <Trash2 size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Effacer
            </button>
          </div>

          <div className={styles.historyList}>
            {history.map((h, i) => (
              <div
                key={`${h.tracking_number}-${i}`}
                className={styles.historyItem}
                onClick={() => handleLookup(h.tracking_number)}
              >
                <div className={styles.historyLeft}>
                  <span className={styles.historyTime}>{h.timestamp}</span>
                  <span className={styles.historyNum}>{h.tracking_number}</span>
                  {h.clientName && (
                    <span style={{ color: '#64748b', fontSize: 11 }}>({h.clientName})</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className={styles.historyBadge}
                    style={{
                      backgroundColor: getStatusInfo(h.newStatus).bgColor,
                      color: getStatusInfo(h.newStatus).color,
                      border: `1px solid ${getStatusInfo(h.newStatus).color}30`
                    }}
                  >
                    {getStatusInfo(h.newStatus).label}
                  </span>
                  <ExternalLink size={14} color="#94a3b8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
