'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Camera, CameraOff, Search, ArrowRight, Package, CheckCircle2, 
  Loader2, ScanBarcode, Clock, MapPin, User, Weight, 
  ExternalLink, Volume2, VolumeX, Sparkles, AlertCircle, 
  RotateCw, Check, Copy, History, Trash2, Zap, Barcode, Tag,
  FileEdit, Cog, Plane, RotateCcw
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useToast } from '@/components/ui/ToastProvider';
import { findShipmentByTracking, scanShipmentAction } from '@/actions/shipments';
import { SHIPMENT_STATUSES, getStatusInfo, getStatusIndex } from '@/lib/trackingStatuses';
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

  // Helper pour afficher les vraies icônes de statut
  const renderStatusIcon = (iconName: string, size = 16) => {
    switch (iconName) {
      case 'FileEdit': return <FileEdit size={size} />;
      case 'Package': return <Package size={size} />;
      case 'Cog': return <Cog size={size} />;
      case 'Plane': return <Plane size={size} />;
      case 'MapPin': return <MapPin size={size} />;
      case 'CheckCircle2': return <CheckCircle2 size={size} />;
      default: return null;
    }
  };

  // Search & input
  const [trackingInput, setTrackingInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Mode pointage en lot ──
  const [batchMode, setBatchMode] = useState(false);
  const [batchTargetStatus, setBatchTargetStatus] = useState<string>('RECEIVED');
  const [batchLocation, setBatchLocation] = useState<string>('Hub Central Conakry');
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchLogs, setBatchLogs] = useState<Array<{
    id: string;
    tracking_number: string;
    timestamp: string;
    previousStatus: string;
    newStatus: string;
    success: boolean;
    errorMsg?: string;
  }>>([]);
  const [lastSuccessfulBatchScan, setLastSuccessfulBatchScan] = useState<{
    tracking_number: string;
    previousStatus: string;
    newStatus: string;
    location: string;
  } | null>(null);
  const lastBatchScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Helper pour nettoyer la valeur reçue (trim, espaces et retours à la ligne retirés, majuscules)
  const cleanTrackingCode = (val: string) => {
    return val.replace(/\s+/g, '').toUpperCase();
  };

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
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

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

  // Audio tone generator for error feedback
  const playErrorBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([120, 60, 120]);
      }
    } catch (e) {}
  };

  // Load history from localStorage on mount & focus input automatically
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tangaly_scanner_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        setTodayCount(parsed.length);
      }
    } catch (e) {}

    // Focus automatique à l'ouverture de la page
    inputRef.current?.focus();

    // Si l'agent clique ailleurs (bouton, liste), le focus revient dès qu'il n'est plus dans un autre champ de saisie
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isOtherEditable =
        (target.tagName === 'INPUT' && target !== inputRef.current) ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isOtherEditable) return;

      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        const activeIsOtherEditable = active && (
          (active.tagName === 'INPUT' && active !== inputRef.current) ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable
        );

        if (!activeIsOtherEditable) {
          inputRef.current?.focus();
        }
      }, 50);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
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
      case 'DELIVERED': return '';
      default: return '';
    }
  };

  // Search parcel by tracking number
  const handleLookup = async (codeToSearch: string) => {
    const code = cleanTrackingCode(codeToSearch);
    if (!code) return;

    // Vider le champ pour préparer le scan suivant
    setTrackingInput('');
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await findShipmentByTracking(code);
      if (res.success && res.data) {
        playScanBeep();
        setShipment(res.data);
        setTargetStatus(suggestNextStatus(res.data.statut));
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
      // Reprendre le focus après chaque recherche
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Handle submit manual search form
  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = cleanTrackingCode(trackingInput);
    if (code) {
      if (batchMode) {
        await handleBatchScan(code);
      } else {
        await handleLookup(code);
      }
    }
  };

  // Traitement direct du scan en Mode Lot
  const handleBatchScan = async (codeToSearch: string) => {
    const code = cleanTrackingCode(codeToSearch);
    if (!code) return;

    // 6. Empêche les doubles enregistrements si le même numéro est scanné deux fois à moins d'une seconde d'intervalle
    const now = Date.now();
    if (code === lastBatchScanRef.current.code && now - lastBatchScanRef.current.time < 1000) {
      return;
    }
    lastBatchScanRef.current = { code, time: now };

    setTrackingInput('');
    setLoading(true);
    setBatchError(null);
    setBatchSuccess(null);

    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      const findRes = await findShipmentByTracking(code);

      // Cas d'erreur 1 : numéro introuvable
      if (!findRes.success || !findRes.data) {
        playErrorBeep();
        const msg = `Colis "${code}" introuvable.`;
        setBatchError(msg);
        addToast('error', 'Colis introuvable', msg);
        setBatchLogs(prev => [
          {
            id: Date.now().toString(),
            tracking_number: code,
            timestamp: timeStr,
            previousStatus: '—',
            newStatus: batchTargetStatus,
            success: false,
            errorMsg: 'Introuvable',
          },
          ...prev,
        ]);
        return;
      }

      const found = findRes.data;

      // Cas d'erreur 2 : colis déjà « Livré » (ne jamais le faire reculer)
      if (found.statut === 'DELIVERED') {
        playErrorBeep();
        const msg = `Le colis ${code} est déjà Livré (impossible de le faire reculer).`;
        setBatchError(msg);
        addToast('error', 'Déjà livré', msg);
        setBatchLogs(prev => [
          {
            id: Date.now().toString(),
            tracking_number: code,
            timestamp: timeStr,
            previousStatus: 'DELIVERED',
            newStatus: batchTargetStatus,
            success: false,
            errorMsg: 'Déjà livré (recul interdit)',
          },
          ...prev,
        ]);
        return;
      }

      // Cas d'erreur 3 : colis déjà pointé avec ce même statut
      if (found.statut === batchTargetStatus) {
        playErrorBeep();
        const currentLabel = getStatusInfo(found.statut).label;
        const msg = `Le colis ${code} est déjà au statut "${currentLabel}".`;
        setBatchError(msg);
        addToast('error', 'Déjà à ce statut', msg);
        setBatchLogs(prev => [
          {
            id: Date.now().toString(),
            tracking_number: code,
            timestamp: timeStr,
            previousStatus: found.statut,
            newStatus: batchTargetStatus,
            success: false,
            errorMsg: `Déjà ${currentLabel}`,
          },
          ...prev,
        ]);
        return;
      }

      // Cas d'erreur 4 : statut antérieur au statut actuel du colis
      const currentIndex = getStatusIndex(found.statut);
      const targetIndex = getStatusIndex(batchTargetStatus);
      if (currentIndex >= 0 && targetIndex >= 0 && targetIndex < currentIndex) {
        playErrorBeep();
        const currentLabel = getStatusInfo(found.statut).label;
        const targetLabel = getStatusInfo(batchTargetStatus).label;
        const msg = `Le statut cible "${targetLabel}" est antérieur au statut actuel "${currentLabel}".`;
        setBatchError(msg);
        addToast('error', 'Statut antérieur', msg);
        setBatchLogs(prev => [
          {
            id: Date.now().toString(),
            tracking_number: code,
            timestamp: timeStr,
            previousStatus: found.statut,
            newStatus: batchTargetStatus,
            success: false,
            errorMsg: `Antérieur (${targetLabel} < ${currentLabel})`,
          },
          ...prev,
        ]);
        return;
      }

      // 2. Enregistrer immédiatement le pointage avec ce statut et cette localisation
      const prevStatut = found.statut;
      const res = await scanShipmentAction(
        found.tracking_number,
        batchTargetStatus,
        'Pointage automatique en lot',
        batchLocation || locationNote
      );

      if (res.success && res.data) {
        // 3. Bip de succès et message vert bref
        playScanBeep();
        const targetLabel = getStatusInfo(batchTargetStatus).label;
        const msg = `Colis ${code} pointé avec succès : ${targetLabel}`;
        setBatchSuccess(msg);
        addToast('success', 'Pointé en lot', msg);
        setShipment(res.data);

        setLastSuccessfulBatchScan({
          tracking_number: code,
          previousStatus: prevStatut,
          newStatus: batchTargetStatus,
          location: batchLocation || locationNote,
        });

        // 4. Ajout au journal de session
        setBatchLogs(prev => [
          {
            id: Date.now().toString(),
            tracking_number: code,
            timestamp: timeStr,
            previousStatus: prevStatut,
            newStatus: batchTargetStatus,
            success: true,
          },
          ...prev,
        ]);

        saveHistoryItem({
          tracking_number: found.tracking_number,
          previousStatus: prevStatut,
          newStatus: batchTargetStatus,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          clientName: found.client?.user?.nom || 'Client',
        });
      } else {
        playErrorBeep();
        const errMsg = res.message || 'Erreur lors de la mise à jour.';
        setBatchError(errMsg);
        addToast('error', 'Erreur pointage', errMsg);
      }
    } catch (err) {
      playErrorBeep();
      setBatchError('Erreur technique lors du pointage.');
      addToast('error', 'Erreur', 'Impossible de contacter le serveur.');
    } finally {
      // 3. Reprendre le focus après chaque scan
      setLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // 7. Annuler le dernier pointage
  const handleUndoLastBatchScan = async () => {
    if (!lastSuccessfulBatchScan) return;
    const { tracking_number, previousStatus, location } = lastSuccessfulBatchScan;

    const prevLabel = getStatusInfo(previousStatus).label;
    const confirmed = window.confirm(
      `Annuler le dernier pointage du colis "${tracking_number}" et le rétablir au statut "${prevLabel}" ?`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await scanShipmentAction(
        tracking_number,
        previousStatus,
        'Annulation du dernier pointage en lot',
        location
      );

      if (res.success && res.data) {
        playScanBeep();
        addToast('info', 'Pointage annulé', `Le colis ${tracking_number} a été remis à "${prevLabel}".`);
        setBatchSuccess(`Pointage annulé : ${tracking_number} rétabli à "${prevLabel}".`);
        setShipment(res.data);

        setBatchLogs(prev => prev.map(item => {
          if (item.tracking_number === tracking_number && item.success) {
            return {
              ...item,
              success: false,
              errorMsg: `Annulé (remis à ${prevLabel})`,
            };
          }
          return item;
        }));

        setLastSuccessfulBatchScan(null);
      } else {
        playErrorBeep();
        setBatchError(res.message || 'Impossible d\'annuler le pointage.');
      }
    } catch (e) {
      playErrorBeep();
      setBatchError('Erreur technique lors de l\'annulation.');
    } finally {
      setActionLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Confirm status update
  const handleConfirmStatus = async () => {
    if (!shipment?.tracking_number) return;
    if (!targetStatus) {
      setError('Veuillez sélectionner un statut avant d\'enregistrer.');
      return;
    }

    // Si l'agent choisit un statut antérieur au statut actuel, demander une confirmation
    const currentIndex = getStatusIndex(shipment.statut);
    const targetIndex = getStatusIndex(targetStatus);
    if (currentIndex >= 0 && targetIndex >= 0 && targetIndex < currentIndex) {
      const currentLabel = getStatusInfo(shipment.statut).label;
      const targetLabel = getStatusInfo(targetStatus).label;
      const confirmed = window.confirm(
        `Attention : Le statut sélectionné "${targetLabel}" est antérieur au statut actuel "${currentLabel}".\n\nConfirmez-vous ce retour en arrière ?`
      );
      if (!confirmed) {
        return;
      }
    }

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
    <div className={styles.container} style={{ paddingBottom: '120px' }}>
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
          {/* Switch Mode Pointage en lot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: batchMode ? '#eff6ff' : '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              transition: 'background 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: batchMode ? '#2563eb' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: batchMode ? '#ffffff' : '#64748b',
                }}
              >
                <Zap size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: batchMode ? '#1e40af' : '#1e293b' }}>
                  Mode pointage en lot
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {batchMode ? 'Enregistrement direct au scan sans clic' : 'Désactivé (mode unitaire)'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setBatchMode(prev => !prev);
                setBatchError(null);
                setBatchSuccess(null);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                border: batchMode ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: batchMode ? '#2563eb' : '#ffffff',
                color: batchMode ? '#ffffff' : '#475569',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: batchMode ? '#ffffff' : '#94a3b8',
                }}
              />
              {batchMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
            </button>
          </div>

          {/* Configuration du lot quand le mode est actif */}
          {batchMode && (
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  1. Statut cible du lot (choisir une fois) :
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px' }}>
                  {SHIPMENT_STATUSES.filter(s => s.code !== 'CREATED').map((st) => (
                    <button
                      key={st.code}
                      type="button"
                      onClick={() => {
                        setBatchTargetStatus(st.code);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 9px',
                        border: batchTargetStatus === st.code ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: batchTargetStatus === st.code ? '#eff6ff' : '#ffffff',
                        color: batchTargetStatus === st.code ? '#1d4ed8' : '#334155',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {renderStatusIcon(st.icon, 14)}
                      </span>
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  2. Localisation actuelle du lot :
                </div>
                <input
                  type="text"
                  value={batchLocation}
                  onChange={(e) => setBatchLocation(e.target.value)}
                  placeholder="Ex: Hub Conakry, Aéroport JFK, Entrepôt USA..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                  }}
                />
              </div>

              {/* Barre résumé du lot & Annulation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d' }}>
                  📦 {batchLogs.filter(b => b.success).length} colis pointé{batchLogs.filter(b => b.success).length > 1 ? 's' : ''} en lot
                </div>

                {lastSuccessfulBatchScan && (
                  <button
                    type="button"
                    onClick={handleUndoLastBatchScan}
                    disabled={actionLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '6px',
                      color: '#e11d48',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={13} />
                    Annuler le dernier pointage ({lastSuccessfulBatchScan.tracking_number})
                  </button>
                )}
              </div>
            </div>
          )}

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
                          const raw = detectedCodes[0]?.rawValue || (typeof detectedCodes[0] === 'string' ? detectedCodes[0] : null);
                          if (!raw) return;
                          
                          const now = Date.now();
                          if (raw === lastScanRef.current.code && now - lastScanRef.current.time < 3000) {
                            return;
                          }
                          if (now - lastScanRef.current.time < 900) {
                            return;
                          }
                          lastScanRef.current = { code: raw, time: now };
                          if (batchMode) {
                            handleBatchScan(raw);
                          } else {
                            handleLookup(raw);
                          }
                        }
                      }}
                      onError={(err) => {
                        console.warn("Camera scanner notice:", err);
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
              {/* Messages d'alerte en Mode Lot */}
              {batchMode && batchError && (
                <div className={styles.alertError} role="alert" style={{ marginBottom: 10 }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{batchError}</div>
                </div>
              )}

              {batchMode && batchSuccess && (
                <div className={styles.alertSuccess} role="status" style={{ marginBottom: 10 }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>{batchSuccess}</div>
                </div>
              )}

              <form onSubmit={handleManualSubmit} className={styles.searchBar}>
                <div className={styles.inputWrap}>
                  <Search size={18} className={styles.inputIcon} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(cleanTrackingCode(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleManualSubmit();
                      }
                    }}
                    placeholder={batchMode ? `Mode Lot : Scannez vers [${getStatusInfo(batchTargetStatus).label}]` : "Saisir N° suivi (ex: TGL-2024-...)"}
                    className={styles.textInput}
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !cleanTrackingCode(trackingInput)}
                  className={styles.submitSearchBtn}
                >
                  {loading ? (
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <span>{batchMode ? 'Pointer' : 'Rechercher'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Journal de session en lot */}
              {batchMode && batchLogs.length > 0 && (
                <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                      Historique du lot en cours ({batchLogs.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => setBatchLogs([])}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Effacer la liste
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                    {batchLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: log.success ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${log.success ? '#bbf7d0' : '#fecaca'}`,
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{log.tracking_number}</span>
                          <span style={{ color: '#64748b', fontSize: '11px' }}>{log.timestamp}</span>
                        </div>
                        <div>
                          {log.success ? (
                            <span style={{ color: '#15803d', fontWeight: 'bold', fontSize: '11px' }}>
                              ✅ {getStatusInfo(log.newStatus).label}
                            </span>
                          ) : (
                            <span style={{ color: '#b91c1c', fontWeight: '600', fontSize: '11px' }}>
                              ❌ {log.errorMsg}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

                  {/* Message d'information si le colis est déjà livré */}
                  {shipment.statut === 'DELIVERED' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        background: '#f0fff4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        color: '#15803d',
                        fontWeight: '600',
                        fontSize: '13px',
                      }}
                    >
                      <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                      <span>Ce colis est déjà livré</span>
                    </div>
                  )}

                  <div className={styles.statusSelectorGrid}>
                    {SHIPMENT_STATUSES.map((st) => (
                      <button
                        key={st.code}
                        type="button"
                        onClick={() => setTargetStatus(st.code)}
                        className={`${styles.statusPillBtn} ${targetStatus === st.code ? styles.statusPillSelected : ''}`}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                          {renderStatusIcon(st.icon)}
                        </span>
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
                    disabled={actionLoading || !targetStatus}
                    className={styles.confirmUpdateBtn}
                  >
                    {actionLoading ? (
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Enregistrer le pointage {targetStatus ? `(${getStatusInfo(targetStatus).label})` : ''}</span>
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
