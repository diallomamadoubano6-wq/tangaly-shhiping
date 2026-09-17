'use client';
import { useState } from 'react';
import styles from '../operations.module.css';
import { Camera, Search, ArrowRight, Package, CheckCircle, Loader2, ScanBarcode } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/ToastProvider';

export default function AgentScanner() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const { addToast } = useToast();

  const { data: session } = useSession();
  const token = (session as any)?.token || '';

  const handleScanFromText = async (textToScan: string) => {
    if (!textToScan) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/shipments/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tracking_number: textToScan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors du scan');
      setResult(data);
      setSuccess('Scan validé avec succès ! Statut mis à jour.');
      addToast('success', 'Succès', 'Le statut du colis a été mis à jour automatiquement.');
    } catch (err: any) {
      setError(err.message);
      addToast('error', 'Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleScanFromText(trackingNumber);
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Scanner un Colis</h1>
          <p className={styles.pageSubtitle}>Scannez le QR Code ou entrez le numéro d&apos;expédition pour mettre à jour le statut.</p>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
        {/* Panneau Scanner */}
        <div className={styles.card} style={{padding:'40px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:28}}>
          {/* Zone Caméra */}
          <div style={{
            width: '100%', maxWidth: 400,
            border: '2px dashed #cbd5e1', borderRadius: 16,
            overflow: 'hidden',
            backgroundColor:'#f8fafc',
            position: 'relative',
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {!cameraActive ? (
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
                <Camera size={48} color="#94a3b8" />
                <p style={{color:'#64748b', fontSize:13, margin:0}}>Caméra désactivée</p>
                <button 
                  className={styles.primaryButton} 
                  style={{fontSize:13, padding:'8px 16px'}}
                  onClick={() => setCameraActive(true)}
                >
                  Activer la caméra
                </button>
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%' }}>
                <Scanner
                  onScan={(detectedCodes: any) => {
                    if (detectedCodes && detectedCodes.length > 0) {
                      setTrackingNumber(detectedCodes[0].rawValue);
                      setCameraActive(false); // Stop scanning to prevent multiple scans
                      handleScanFromText(detectedCodes[0].rawValue);
                    }
                  }}
                  formats={['qr_code', 'code_128', 'ean_13']}
                  components={{}}
                />
                <button 
                  style={{
                    position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: '6px 12px',
                    borderRadius: 20, cursor: 'pointer', fontSize: 12
                  }}
                  onClick={() => setCameraActive(false)}
                >
                  Fermer la caméra
                </button>
              </div>
            )}
          </div>

          <div style={{color:'#94a3b8', fontSize:13, fontWeight:600, letterSpacing:'0.1em'}}>— OU —</div>

          {/* Formulaire recherche */}
          <form onSubmit={handleScan} style={{display:'flex', gap:10, width:'100%', maxWidth:380}}>
            <div className={styles.searchBox} style={{flex:1}}>
              <Search size={17} className={styles.searchIcon} />
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="N° expédition (ex: TGL-123)"
                className={styles.searchInput}
              />
            </div>
            <button type="submit" disabled={loading} className={styles.primaryButton} style={{whiteSpace:'nowrap'}}>
              {loading ? <Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> : <><ArrowRight size={16}/> Chercher</>}
            </button>
          </form>
        </div>

        {/* Panneau Résultat */}
        <div className={styles.card}>
          <div style={{padding:'20px 24px', borderBottom:'1px solid #f1f5f9'}}>
            <h2 style={{margin:0, fontSize:16, fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:8}}>
              <ScanBarcode size={18} color="#2563eb"/> Résultat du Scan
            </h2>
          </div>
          <div style={{padding:24}}>
            {error && (
              <div style={{padding:'14px 16px', borderRadius:10, background:'#fef2f2', color:'#b91c1c', fontSize:14, borderLeft:'3px solid #ef4444'}}>
                ⚠ {error}
              </div>
            )}
            {success && (
              <div style={{padding:'14px 16px', borderRadius:10, background:'#f0fdf4', color:'#15803d', fontSize:14, fontWeight:500, borderLeft:'3px solid #10b981'}}>
                ✓ {success}
              </div>
            )}
            {!result && !error && !loading && (
              <div style={{textAlign:'center', color:'#94a3b8', padding:'60px 0', fontSize:14}}>
                <ScanBarcode size={40} color="#e2e8f0" style={{margin:'0 auto 16px'}}/>
                <div>En attente de scan...</div>
              </div>
            )}
            {loading && (
              <div style={{textAlign:'center', color:'#2563eb', padding:'60px 0'}}>
                <Loader2 size={32} style={{animation:'spin 1s linear infinite', margin:'0 auto 12px'}}/>
                <div style={{fontSize:14}}>Recherche en cours...</div>
              </div>
            )}
            {result && (
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:8, color:'#2563eb', fontWeight:700, fontSize:18}}>
                      <Package size={20}/> {result.tracking_number}
                    </div>
                    <p style={{margin:'6px 0 0', color:'#64748b', fontSize:13}}>{result.origine} ➔ {result.destination} ({result.poids || 0} kg)</p>
                  </div>
                  <span className={`${styles.badge} ${styles.badgeWarning}`}>{result.statut}</span>
                </div>
                <hr style={{border:'none', borderTop:'1px solid #f1f5f9', margin:0}}/>
                <button disabled className={styles.secondaryButton} style={{justifyContent:'center', opacity:0.7}}>
                  <CheckCircle size={16}/> Statut mis à jour automatiquement
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
