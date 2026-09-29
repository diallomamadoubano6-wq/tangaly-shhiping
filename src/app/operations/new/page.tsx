'use client';
import { useState, useEffect } from 'react';
import { createShipment } from '@/actions/shipments';
import styles from '../operations.module.css';
import { PlusSquare, Save, Package, User, MapPin, CheckCircle, Printer, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function NewShipmentPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || '';

  useEffect(() => {
    const fee = localStorage.getItem('tangaly_handling_fee');
    if (fee) {
      setHandlingFee(Number(fee));
    }
    if (userRole === 'GERANT_GUINEE' || userRole === 'AGENT_GUINEE') {
      setDirection('GN_USA'); // Guinée envoie vers USA
    } else if (userRole === 'GERANT_USA') {
      setDirection('USA_GN'); // USA envoie vers Guinée
    }
  }, [userRole]);

  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [isKnownClient, setIsKnownClient] = useState(false);

  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [isKnownReceiver, setIsKnownReceiver] = useState(false);

  const [weight, setWeight] = useState('');
  const [boxes, setBoxes] = useState('1');
  const [transportType, setTransportType] = useState('AERIEN');
  const [description, setDescription] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [handlingFee, setHandlingFee] = useState(15);
  const [direction, setDirection] = useState<'GN_USA' | 'USA_GN'>('GN_USA');

  const [showReceipt, setShowReceipt] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  const knownClients: Record<string, string> = {
    "620123456": "Mamadou Diallo",
    "621987654": "Fatoumata Camara"
  };

  const knownReceivers: Record<string, {name: string, address: string}> = {
    "12125550198": { name: "Ousmane Sylla", address: "456 Bronx Blvd, New York, NY" }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/[^0-9]/g, '');
    setSenderPhone(phone);
    if (knownClients[phone]) {
      setSenderName(knownClients[phone]);
      setIsKnownClient(true);
    } else {
      setIsKnownClient(false);
    }
  };

  const handleReceiverPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/[^0-9]/g, '');
    setReceiverPhone(phone);
    if (knownReceivers[phone]) {
      setReceiverName(knownReceivers[phone].name);
      setReceiverAddress(knownReceivers[phone].address);
      setIsKnownReceiver(true);
    } else {
      setIsKnownReceiver(false);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        origine: direction === 'GN_USA' ? 'Conakry' : 'New York',
        destination: direction === 'GN_USA' ? 'New York' : 'Conakry',
        type_transport: transportType,
        senderName,
        senderPhone,
        senderAddress,
        receiverName,
        receiverPhone,
        receiverAddress,
        description,
        boxes,
        poids: weight,
        amountPaid,
        paymentMethod,
        freightCost,
        docFee,
        totalAmount: total,
        balance
      };

            const res = await createShipment(payload);

      if (!res.success) throw new Error(res.message || 'Erreur lors de la création');

      setTrackingNumber(res.data?.tracking_number || '');
      setShowReceipt(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const ratePerKg = transportType === 'AERIEN' ? 12 : 5;
  const freightCost = Number(weight) * ratePerKg;
  const docFee = 15;
  const total = freightCost + docFee;
  const paid = amountPaid === '' ? total : Number(amountPaid);
  const balance = total - paid;
  
  const today = new Date().toLocaleDateString('fr-FR');

  const viewReceipt = () => {
    const printContent = document.getElementById('printable-receipt');
    if (printContent) {
      const printWindow = window.open('', '', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Affichage Reçu</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: black; background: white; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
      }
    }
  };

    const printLabel = () => {
    const printWindow = window.open('', '', 'width=400,height=400');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Étiquette QR</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; color: black; background: white; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
              .box { border: 4px solid black; padding: 20px; border-radius: 10px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .track { font-size: 32px; font-weight: 900; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="title">TANGALY LOGISTICS</div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${trackingNumber}" alt="QR Code" style="width: 200px; height: 200px;" />
              <div class="track">ID: ${trackingNumber}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const printReceipt = () => {
    const printContent = document.getElementById('printable-receipt');
    if (printContent) {
      const printWindow = window.open('', '', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Impression Reçu</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: black; background: white; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  return (
    <div style={{position: 'relative', width: '100%'}}>
      {/* Hide this entire section when printing */}
            

      <div className="no-print">
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Nouvelle Expédition</h2>
            <p className={styles.cardSubtitle}>Enregistrez un nouveau colis pour un client.</p>
          </div>
        </div>
        
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca' }}>{error}</div>}

        
        <div className={styles.chartCard}>
          <form style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>

            {/* Direction Selector — visible uniquement pour Super Admin */}
            {(userRole === 'SUPER_ADMIN' || userRole === '') ? (
              <div style={{display:'flex', gap:12, marginBottom:4, flexWrap: 'wrap'}}>
                <button
                  type="button"
                  onClick={() => setDirection('GN_USA')}
                  style={{
                    flex: '1 1 200px', minWidth: 160, padding:'14px', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:15,
                    border: direction === 'GN_USA' ? '2px solid #2563eb' : '2px solid #e2e8f0',
                    background: direction === 'GN_USA' ? '#eff6ff' : 'white',
                    color: direction === 'GN_USA' ? '#2563eb' : '#64748b',
                    transition:'all 0.2s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10
                  }}
                >
                  {/* Drapeau Guinée SVG inline */}
                  <svg width="28" height="18" viewBox="0 0 3 2" style={{borderRadius:3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>
                    <rect width="1" height="2" fill="#CE1126"/>
                    <rect x="1" width="1" height="2" fill="#FCD116"/>
                    <rect x="2" width="1" height="2" fill="#009460"/>
                  </svg>
                  Guinée →
                  <svg width="28" height="18" viewBox="0 0 7 4" style={{borderRadius:3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>
                    <rect width="7" height="4" fill="#B22234"/>
                    <rect y="0.5" width="7" height="0.4" fill="white"/>
                    <rect y="1.5" width="7" height="0.4" fill="white"/>
                    <rect y="2.5" width="7" height="0.4" fill="white"/>
                    <rect y="3.1" width="7" height="0.4" fill="white"/>
                    <rect width="3" height="2.2" fill="#3C3B6E"/>
                  </svg>
                  USA
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('USA_GN')}
                  style={{
                    flex: '1 1 200px', minWidth: 160, padding:'14px', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:15,
                    border: direction === 'USA_GN' ? '2px solid #2563eb' : '2px solid #e2e8f0',
                    background: direction === 'USA_GN' ? '#eff6ff' : 'white',
                    color: direction === 'USA_GN' ? '#2563eb' : '#64748b',
                    transition:'all 0.2s',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10
                  }}
                >
                  <svg width="28" height="18" viewBox="0 0 7 4" style={{borderRadius:3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>
                    <rect width="7" height="4" fill="#B22234"/>
                    <rect y="0.5" width="7" height="0.4" fill="white"/>
                    <rect y="1.5" width="7" height="0.4" fill="white"/>
                    <rect y="2.5" width="7" height="0.4" fill="white"/>
                    <rect y="3.1" width="7" height="0.4" fill="white"/>
                    <rect width="3" height="2.2" fill="#3C3B6E"/>
                  </svg>
                  USA →
                  <svg width="28" height="18" viewBox="0 0 3 2" style={{borderRadius:3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>
                    <rect width="1" height="2" fill="#CE1126"/>
                    <rect x="1" width="1" height="2" fill="#FCD116"/>
                    <rect x="2" width="1" height="2" fill="#009460"/>
                  </svg>
                  Guinée
                </button>
              </div>
            ) : (
              /* Bannière de direction fixée pour les agents */
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '14px', borderRadius: 12,
                border: '2px solid #2563eb', background: '#eff6ff', fontWeight: 700, fontSize: 15, color: '#1d4ed8'
              }}>
                {direction === 'GN_USA' ? (
                  <>
                    <svg width="28" height="18" viewBox="0 0 3 2" style={{borderRadius:3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>
                      <rect width="1" height="2" fill="#CE1126"/>
                      <rect x="1" width="1" height="2" fill="#FCD116"/>
                      <rect x="2" width="1" height="2" fill="#009460"/>
                    </svg>
                    Guinée → USA
                    <svg width="28" height="18" viewBox="0 0 7 4" style={{borderRadius:3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>
                      <rect width="7" height="4" fill="#B22234"/>
                      <rect y="0.5" width="7" height="0.4" fill="white"/>
                      <rect y="1.5" width="7" height="0.4" fill="white"/>
                      <rect y="2.5" width="7" height="0.4" fill="white"/>
                      <rect y="3.1" width="7" height="0.4" fill="white"/>
                      <rect width="3" height="2.2" fill="#3C3B6E"/>
                    </svg>
                  </>
                ) : (
                  <>
                    <svg width="28" height="18" viewBox="0 0 7 4" style={{borderRadius:3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>
                      <rect width="7" height="4" fill="#B22234"/>
                      <rect y="0.5" width="7" height="0.4" fill="white"/>
                      <rect y="1.5" width="7" height="0.4" fill="white"/>
                      <rect y="2.5" width="7" height="0.4" fill="white"/>
                      <rect y="3.1" width="7" height="0.4" fill="white"/>
                      <rect width="3" height="2.2" fill="#3C3B6E"/>
                    </svg>
                    USA → Guinée
                    <svg width="28" height="18" viewBox="0 0 3 2" style={{borderRadius:3, boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>
                      <rect width="1" height="2" fill="#CE1126"/>
                      <rect x="1" width="1" height="2" fill="#FCD116"/>
                      <rect x="2" width="1" height="2" fill="#009460"/>
                    </svg>
                  </>
                )}
              </div>
            )}

            {/* Route label */}
            <div style={{textAlign:'center', color:'#64748b', fontSize:13, marginTop:-8, marginBottom:4, display:'flex', alignItems:'center', justifyContent:'center', gap:6}}>
              <MapPin size={13} color="#94a3b8"/>
              {direction === 'GN_USA' ? 'Départ : Conakry — Arrivée : New York' : 'Départ : New York — Arrivée : Conakry'}
            </div>

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px'}}>
              {/* Expéditeur */}
              <div style={{padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white'}}>
                <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:16, marginBottom:20, color:'#0f172a'}}><User size={18} color="#2563eb"/> Informations de l'Expéditeur</h3>
                <div style={{display:'flex', flexDirection:'column', gap:16}}>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Téléphone *</label>
                    <div style={{position: 'relative'}}>
                      <input type="tel" value={senderPhone} onChange={handlePhoneChange} placeholder="ex: 620..." style={{width:'100%', padding: '10px 12px', border: isKnownClient ? '2px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none', boxSizing:'border-box'}} />
                      {isKnownClient && <CheckCircle size={18} color="#10b981" style={{position: 'absolute', right: 10, top: 10}} />}
                    </div>
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Nom Complet *</label>
                    <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Nom complet" style={{width:'100%', padding: '10px 12px', border: isKnownClient ? '1px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, background: isKnownClient ? '#ecfdf5' : 'white', outline:'none', boxSizing:'border-box'}} />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Adresse (Ville, Quartier)</label>
                    <input type="text" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder="Adresse" style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none', boxSizing:'border-box'}} />
                  </div>
                </div>
              </div>

              {/* Destinataire */}
              <div style={{padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white'}}>
                <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:16, marginBottom:20, color:'#0f172a'}}><MapPin size={18} color="#dc2626"/> Informations du Destinataire</h3>
                <div style={{display:'flex', flexDirection:'column', gap:16}}>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Téléphone (USA/Guinée) *</label>
                    <div style={{position: 'relative'}}>
                      <input type="tel" value={receiverPhone} onChange={handleReceiverPhoneChange} placeholder="Numéro du destinataire" style={{width:'100%', padding: '10px 12px', border: isKnownReceiver ? '2px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none', boxSizing:'border-box'}} />
                      {isKnownReceiver && <CheckCircle size={18} color="#10b981" style={{position: 'absolute', right: 10, top: 10}} />}
                    </div>
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Nom Complet *</label>
                    <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Nom complet" style={{width:'100%', padding: '10px 12px', border: isKnownReceiver ? '1px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, background: isKnownReceiver ? '#ecfdf5' : 'white', outline:'none', boxSizing:'border-box'}} />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Adresse (Ville / État) *</label>
                    <input type="text" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} placeholder="ex: Bronx, NY" style={{width:'100%', padding: '10px 12px', border: isKnownReceiver ? '1px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, background: isKnownReceiver ? '#ecfdf5' : 'white', outline:'none', boxSizing:'border-box'}} />
                  </div>
                </div>
              </div>
            </div>

            {/* Détails du colis */}
            <div style={{padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white'}}>
                <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:16, marginBottom:20, color:'#0f172a'}}><Package size={18} color="#f59e0b"/> Détails du Colis & Facturation</h3>
                
                <div style={{display:'flex', flexDirection:'column', gap:20}}>
                  {/* Row 1: Description */}
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Description des Marchandises *</label>
                    <input type="text" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ex: Vêtements, chaussures, documents..." style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none', boxSizing:'border-box'}} />
                  </div>

                  {/* Row 2: Boxes, Weight, Transport */}
                  <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap:16}}>
                    <div>
                      <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Nombre de Colis (Cartons)</label>
                      <input type="number" min="1" value={boxes} onChange={e=>setBoxes(e.target.value)} style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none', boxSizing:'border-box'}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Poids Total (kg) *</label>
                      <input type="number" min="0" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="ex: 15.5" style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none', boxSizing:'border-box'}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Type de Transport</label>
                      <select value={transportType} onChange={e=>setTransportType(e.target.value)} style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, background:'white', outline:'none', cursor:'pointer', boxSizing:'border-box'}}>
                        <option value="AERIEN">Fret Aérien (Rapide) - 12$/kg</option>
                        <option value="MARITIME">Fret Maritime (Éco) - 5$/kg</option>
                      </select>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{height: 1, background: '#e2e8f0', margin: '8px 0'}}></div>

                  {/* Row 3: Finances */}
                  <div style={{display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap:20, alignItems: 'center'}}>
                    <div style={{background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px dashed #cbd5e1'}}>
                      <p style={{margin: '0 0 8px 0', fontSize: 13, color: '#64748b', textTransform: 'uppercase'}}>Récapitulatif Financier</p>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom: 4}}>
                         <span style={{fontSize: 14, color: '#334155'}}>Frais d'expédition :</span>
                         <span style={{fontSize: 14, fontWeight: 500}}>${weight ? (Number(weight) * (transportType === 'AERIEN' ? 12 : 5)).toFixed(2) : '0.00'}</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom: 8}}>
                         <span style={{fontSize: 14, color: '#334155'}}>Frais de dossier :</span>
                         <span style={{fontSize: 14, fontWeight: 500}}>$15.00</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 8}}>
                         <strong style={{fontSize: 16, color: '#0f172a'}}>Montant Total :</strong>
                         <strong style={{fontSize: 18, color: '#2563eb'}}>${weight ? (Number(weight) * (transportType === 'AERIEN' ? 12 : 5) + 15).toFixed(2) : '0.00'}</strong>
                      </div>
                    </div>

                    <div>
                      <label style={{display:'block', fontSize:14, fontWeight:600, color:'#0f172a', marginBottom:8}}>Montant Avancé & Mode de Paiement</label>
                      <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
                        <input type="number" min="0" value={amountPaid} onChange={e=>setAmountPaid(e.target.value)} placeholder="Ex: 50" style={{flex: '1 1 120px', padding: '12px 16px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize:16, outline:'none', boxSizing:'border-box'}} />
                        <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} style={{flex: '1 1 140px', padding: '12px 16px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize:14, background:'white', outline:'none', cursor:'pointer', boxSizing:'border-box'}}>
                          <option value="CASH">Espèces</option>
                          <option value="ZELLE">Zelle</option>
                          <option value="ORANGE_MONEY">Orange Money</option>
                          <option value="OTHER">Autre</option>
                        </select>
                      </div>
                      <p style={{margin: '8px 0 0 0', fontSize: 13, color: '#64748b'}}>Indiquez le montant avancé et comment le client a payé.</p>
                    </div>
                  </div>
                </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap'}}>
               <button type="button" style={{padding: '12px 24px', background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Annuler</button>
               <button type="button" onClick={handleSave} className={styles.primaryButton} disabled={isLoading}>
                 {isLoading ? 'Enregistrement...' : <><Printer size={18}/> Enregistrer & Imprimer</>}
               </button>
            </div>
          </form>
        </div>
      </div>

      {/* RECU MODAL FOR WEB VIEW */}
      {showReceipt && (
        <div className="no-print" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 50, padding: 16}}>
           <div style={{background:'white', width:'500px', maxWidth:'92vw', borderRadius:'16px', padding:'24px', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)', position:'relative', boxSizing:'border-box', maxHeight:'90vh', overflowY:'auto'}}>
              <button onClick={() => setShowReceipt(false)} style={{position:'absolute', right:16, top:16, background:'transparent', border:'none', cursor:'pointer'}}><X size={20} color="#64748b"/></button>
              
              <div style={{textAlign:'center', marginBottom: 24}}>
                 <img src="/lo.jpeg" alt="TANGALY" style={{height:60, marginBottom: 12}}/>
                 <div style={{textAlign:'center'}}><img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${trackingNumber}`} alt="QR Code" style={{width: 80, height: 80, margin: '12px auto'}} /></div>
                 <h2 style={{margin:0, fontSize:18, color:'#0f172a', textTransform:'uppercase'}}>Reçu d'Expédition</h2>
                 <p style={{margin:0, fontSize:14, color:'#64748b'}}>Prêt à être imprimé selon votre format officiel.</p>
              </div>

              <div style={{display:'flex', gap:10, marginTop:24}}>
                <button onClick={printLabel} style={{flex:1, padding:'12px', background:'#2563eb', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
                   <Package size={18}/> Imprimer Étiquette QR (Colis)
                </button>
                <button onClick={printReceipt} style={{flex:1, padding:'12px', background:'#0f172a', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
                   <Printer size={18}/> Imprimer Reçu
                </button>
              </div>
           </div>
        </div>
      )}

            {/* RECU OFFICIEL (PRINT ONLY) - This perfectly matches the photo */}
      <div id="printable-receipt" className="print-only" style={{display: "none", fontFamily: 'Arial, sans-serif', padding: '0', maxWidth: '800px', margin: '0 auto', color: '#1f2937', backgroundColor: '#fff', fontSize: '13px'}}>
         {/* TOP COLOR BAR */}
         <div style={{display:'flex', height:'10px', width:'100%', marginBottom:'20px'}}>
            <div style={{flex:1, backgroundColor:'#dc2626'}}></div>
            <div style={{flex:1, backgroundColor:'#facc15'}}></div>
            <div style={{flex:1, backgroundColor:'#16a34a'}}></div>
         </div>

         {/* HEADER */}
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'0 20px 10px 20px', borderBottom:'2px solid #1e3a8a', marginBottom:'20px'}}>
            <div style={{width:'50%'}}>
               <img src="/lo.jpeg" alt="TANGALY" style={{height:'90px', marginBottom:'10px'}}/>
               <p style={{margin:0, fontSize:'11px', color:'#64748b'}}>Fret aérien USA ⇄ Guinée (Conakry) &middot; Air Freight USA ⇄ Guinea</p>
            </div>
            <div style={{width:'45%', textAlign:'right'}}>
               <h2 style={{color:'#16a34a', fontSize:'14px', margin:'0 0 8px 0', textTransform:'uppercase'}}>REÇU D'EXPÉDITION &middot; SHIPPING RECEIPT</h2>
               <div style={{border:'2px solid #dc2626', borderRadius:'8px', padding:'8px 12px', display:'inline-block'}}>
                  <h2 style={{color:'#dc2626', margin:0, fontSize:'18px'}}>N° {trackingNumber}</h2>
               </div>
               <div style={{marginTop:'8px', fontSize:'13px'}}>Date : <strong>{today}</strong></div>
            </div>
         </div>

         <div style={{padding:'0 20px'}}>
             {/* ADDRESS BOXES */}
             <div style={{display:'flex', gap:'20px', marginBottom:'20px'}}>
                <div style={{flex:1, backgroundColor:'#f8fafc', borderLeft:'6px solid #1e3a8a', padding:'12px', borderRadius:'0 8px 8px 0'}}>
                   <h3 style={{color:'#1e3a8a', margin:'0 0 8px 0', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px'}}>🇺🇸 USA</h3>
                   <p style={{margin:0, lineHeight:'1.5', color:'#333'}}>
                      3429 3rd Ave, Bronx, NY 10456<br/>
                      28 Arlington Avenue, Brooklyn, NY 11207<br/>
                      <strong>+1 (646) 382-0065</strong>
                   </p>
                </div>
                <div style={{flex:1, backgroundColor:'#f8fafc', borderLeft:'6px solid #16a34a', padding:'12px', borderRadius:'0 8px 8px 0'}}>
                   <h3 style={{color:'#16a34a', margin:'0 0 8px 0', fontSize:'14px', display:'flex', alignItems:'center', gap:'6px'}}>🇬🇳 Guinée (Conakry)</h3>
                   <p style={{margin:0, lineHeight:'1.5', color:'#333'}}>
                      Cité Enco 5<br/>
                      <strong>+224 626 98 52 54</strong><br/>
                      <span style={{fontSize:'11px'}}>Zelle : 347-819-6217 &middot; Orange Money : 611-62-83-27</span>
                   </p>
                </div>
             </div>

             {/* SENDER & RECEIVER TABLES */}
             <div style={{display:'flex', gap:'20px', marginBottom:'30px'}}>
                {/* SENDER */}
                <div style={{flex:1, border:'1px solid #e2e8f0', borderRadius:'6px', overflow:'hidden'}}>
                   <div style={{backgroundColor:'#1e3a8a', color:'white', padding:'8px 12px', fontSize:'13px', fontWeight:'bold', textTransform:'uppercase'}}>EXPÉDITEUR &middot; SENDER</div>
                   <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                      <tbody>
                         <tr>
                            <td style={{padding:'8px 12px', borderBottom:'1px solid #e2e8f0', color:'#64748b', width:'40%'}}>Nom / Name</td>
                            <td style={{padding:'8px 12px', borderBottom:'1px solid #e2e8f0', fontWeight:'bold'}}>{senderName}</td>
                         </tr>
                         <tr>
                            <td style={{padding:'8px 12px', borderBottom:'1px solid #e2e8f0', color:'#64748b'}}>Tél. / Phone</td>
                            <td style={{padding:'8px 12px', borderBottom:'1px solid #e2e8f0', fontWeight:'bold'}}>{senderPhone}</td>
                         </tr>
                         <tr>
                            <td style={{padding:'8px 12px', color:'#64748b'}}>Adresse / Address</td>
                            <td style={{padding:'8px 12px', fontWeight:'bold'}}>{senderAddress}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
                {/* RECEIVER */}
                <div style={{flex:1, border:'1px solid #e2e8f0', borderRadius:'6px', overflow:'hidden'}}>
                   <div style={{backgroundColor:'#16a34a', color:'white', padding:'8px 12px', fontSize:'13px', fontWeight:'bold', textTransform:'uppercase'}}>DESTINATAIRE &middot; RECEIVER</div>
                   <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
                      <tbody>
                         <tr>
                            <td style={{padding:'8px 12px', borderBottom:'1px solid #e2e8f0', color:'#64748b', width:'40%'}}>Nom / Name</td>
                            <td style={{padding:'8px 12px', borderBottom:'1px solid #e2e8f0', fontWeight:'bold'}}>{receiverName}</td>
                         </tr>
                         <tr>
                            <td style={{padding:'8px 12px', borderBottom:'1px solid #e2e8f0', color:'#64748b'}}>Tél. / Phone</td>
                            <td style={{padding:'8px 12px', borderBottom:'1px solid #e2e8f0', fontWeight:'bold'}}>{receiverPhone}</td>
                         </tr>
                         <tr>
                            <td style={{padding:'8px 12px', color:'#64748b'}}>Ville / City</td>
                            <td style={{padding:'8px 12px', fontWeight:'bold'}}>{receiverAddress}</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </div>

             {/* SHIPMENT DETAILS */}
             <div style={{marginBottom:'30px'}}>
                <h3 style={{color:'#1e3a8a', fontSize:'14px', textTransform:'uppercase', margin:'0 0 10px 0'}}>DÉTAILS DE L'ENVOI &middot; SHIPMENT DETAILS</h3>
                <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #e2e8f0', textAlign:'left', fontSize:'13px'}}>
                   <thead>
                      <tr style={{backgroundColor:'#f8fafc'}}>
                         <th style={{padding:'10px 12px', color:'#1e3a8a', borderBottom:'1px solid #e2e8f0'}}>DESCRIPTION</th>
                         <th style={{padding:'10px 12px', color:'#1e3a8a', borderBottom:'1px solid #e2e8f0', textAlign:'center'}}>COLIS / BOXES</th>
                         <th style={{padding:'10px 12px', color:'#1e3a8a', borderBottom:'1px solid #e2e8f0', textAlign:'center'}}>POIDS / WEIGHT</th>
                         <th style={{padding:'10px 12px', color:'#1e3a8a', borderBottom:'1px solid #e2e8f0', textAlign:'right'}}>TARIF / RATE</th>
                         <th style={{padding:'10px 12px', color:'#1e3a8a', borderBottom:'1px solid #e2e8f0', textAlign:'right'}}>FRET / FREIGHT</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr>
                         <td style={{padding:'12px', borderBottom:'1px solid #e2e8f0'}}>{description || '-'}</td>
                         <td style={{padding:'12px', borderBottom:'1px solid #e2e8f0', textAlign:'center'}}>{boxes || 1}</td>
                         <td style={{padding:'12px', borderBottom:'1px solid #e2e8f0', textAlign:'center'}}>{weight || 0} kg</td>
                         <td style={{padding:'12px', borderBottom:'1px solid #e2e8f0', textAlign:'right'}}>${ratePerKg}/kg</td>
                         <td style={{padding:'12px', borderBottom:'1px solid #e2e8f0', textAlign:'right', fontWeight:'bold'}}>${freightCost}</td>
                      </tr>
                   </tbody>
                </table>
             </div>

             {/* BOTTOM SECTION */}
             <div style={{display:'flex', gap:'40px', marginBottom:'40px'}}>
                {/* PAYMENT METHOD & SIGNATURES */}
                <div style={{flex:1}}>
                   <div style={{border:'1px solid #e2e8f0', borderRadius:'6px', padding:'12px', marginBottom:'40px'}}>
                      <h4 style={{color:'#1e3a8a', margin:'0 0 12px 0', fontSize:'13px', textTransform:'uppercase'}}>MODE DE PAIEMENT &middot; PAYMENT METHOD</h4>
                      <div style={{display:'flex', flexWrap:'wrap', gap:'15px', fontSize:'13px'}}>
                         <label style={{width:'45%', display:'flex', alignItems:'center', gap:'8px'}}>
                            <div style={{width:'14px', height:'14px', border:'1px solid #64748b', borderRadius:'3px', backgroundColor: paymentMethod==='CASH'?'#16a34a':'white', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}}>{paymentMethod==='CASH'?'✓':''}</div>
                            Espèces / Cash
                         </label>
                         <label style={{width:'45%', display:'flex', alignItems:'center', gap:'8px'}}>
                            <div style={{width:'14px', height:'14px', border:'1px solid #64748b', borderRadius:'3px', backgroundColor: paymentMethod==='ZELLE'?'#16a34a':'white', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}}>{paymentMethod==='ZELLE'?'✓':''}</div>
                            Zelle
                         </label>
                         <label style={{width:'45%', display:'flex', alignItems:'center', gap:'8px'}}>
                            <div style={{width:'14px', height:'14px', border:'1px solid #64748b', borderRadius:'3px', backgroundColor: paymentMethod==='ORANGE_MONEY'?'#16a34a':'white', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}}>{paymentMethod==='ORANGE_MONEY'?'✓':''}</div>
                            Orange Money
                         </label>
                         <label style={{width:'45%', display:'flex', alignItems:'center', gap:'8px'}}>
                            <div style={{width:'14px', height:'14px', border:'1px solid #64748b', borderRadius:'3px', backgroundColor: paymentMethod==='OTHER'?'#16a34a':'white', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}}>{paymentMethod==='OTHER'?'✓':''}</div>
                            Autre / Other
                         </label>
                      </div>
                   </div>
                   
                   <div style={{display:'flex', justifyContent:'space-between', marginTop:'60px'}}>
                      <div style={{width:'45%', borderTop:'1px solid #333', textAlign:'center', paddingTop:'8px', fontSize:'12px', color:'#64748b'}}>Signature client &middot; Customer</div>
                      <div style={{width:'45%', borderTop:'1px solid #333', textAlign:'center', paddingTop:'8px', fontSize:'12px', color:'#64748b'}}>Cachet & signature &middot; Tangaly</div>
                   </div>
                </div>

                {/* PRICING TABLE */}
                <div style={{width:'260px'}}>
                   <table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}>
                      <tbody>
                         <tr>
                            <td style={{padding:'10px', borderBottom:'1px solid #e2e8f0'}}>Fret &middot; Freight</td>
                            <td style={{padding:'10px', borderBottom:'1px solid #e2e8f0', textAlign:'right', fontWeight:'bold'}}>${freightCost}</td>
                         </tr>
                         <tr>
                            <td style={{padding:'10px', borderBottom:'1px solid #e2e8f0'}}>Frais de dossier &middot; Doc. fee</td>
                            <td style={{padding:'10px', borderBottom:'1px solid #e2e8f0', textAlign:'right', fontWeight:'bold'}}>${docFee}</td>
                         </tr>
                         <tr>
                            <td style={{padding:'10px', borderBottom:'1px solid #e2e8f0', fontWeight:'bold'}}>Total</td>
                            <td style={{padding:'10px', borderBottom:'1px solid #e2e8f0', textAlign:'right', fontWeight:'bold'}}>${total}</td>
                         </tr>
                         <tr>
                            <td style={{padding:'10px', color:'#16a34a', fontWeight:'bold'}}>Payé &middot; Paid</td>
                            <td style={{padding:'10px', textAlign:'right', color:'#16a34a', fontWeight:'bold'}}>${paid}</td>
                         </tr>
                         <tr>
                            <td colSpan={2} style={{padding:0}}>
                               <div style={{backgroundColor:'#dc2626', color:'white', padding:'12px', display:'flex', justifyContent:'space-between', borderRadius:'6px', marginTop:'8px'}}>
                                  <span style={{fontWeight:'bold'}}>Reste à payer &middot; Balance</span>
                                  <span style={{fontWeight:'bold', fontSize:'16px'}}>${balance}</span>
                               </div>
                            </td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </div>

             {/* FOOTER */}
             <div style={{borderTop:'1px dashed #cbd5e1', paddingTop:'15px', display:'flex', gap:'20px', fontSize:'10px', color:'#64748b'}}>
                <div style={{flex:1}}>
                   <strong style={{color:'#333', display:'block', marginBottom:'4px'}}>Terms & Conditions</strong>
                   <ul style={{margin:0, paddingLeft:'15px', lineHeight:'1.4'}}>
                      <li>Tangaly Shipping is not responsible for prohibited or illegal items.</li>
                      <li>Tangaly Shipping is not liable for damage due to improper packaging.</li>
                      <li>Estimated delivery time: 5-10 business days.</li>
                   </ul>
                </div>
                <div style={{flex:1}}>
                   <strong style={{color:'#333', display:'block', marginBottom:'4px'}}>Termes et conditions</strong>
                   <ul style={{margin:0, paddingLeft:'15px', lineHeight:'1.4'}}>
                      <li>Tangaly Shipping n'est pas responsable des articles interdits ou illégaux.</li>
                      <li>Tangaly Shipping n'est pas responsable des dommages dus à un mauvais emballage.</li>
                      <li>Délai de livraison estimé : 5-10 jours ouvrables.</li>
                   </ul>
                </div>
             </div>
             
             <div style={{textAlign:'center', marginTop:'30px', fontSize:'11px', paddingBottom:'20px'}}>
                <span style={{color:'#1e3a8a', fontWeight:'bold'}}>Tangaly Shipping & Logistics</span> &middot; Rapide, fiable et sécurisé &middot; Fast, reliable & secure<br/>
                <span style={{color:'#64748b'}}>Merci de votre confiance &middot; Thank you for your trust</span>
             </div>
         </div>
      </div>
    </div>
  );
}
