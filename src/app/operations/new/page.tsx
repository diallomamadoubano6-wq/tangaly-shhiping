'use client';
import { useState, useEffect } from 'react';
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

      const token = (session as any)?.token || '';

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la création');

      setTrackingNumber(data.data.tracking_number);
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
    <div className={styles.dashboard} style={{position: 'relative'}}>
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
              <div style={{display:'flex', gap:12, marginBottom:4}}>
                <button
                  type="button"
                  onClick={() => setDirection('GN_USA')}
                  style={{
                    flex:1, padding:'14px', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:15,
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
                    flex:1, padding:'14px', borderRadius:12, cursor:'pointer', fontWeight:700, fontSize:15,
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

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
              {/* Expéditeur */}
              <div style={{padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white'}}>
                <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:16, marginBottom:20, color:'#0f172a'}}><User size={18} color="#2563eb"/> Informations de l'Expéditeur</h3>
                <div style={{display:'flex', flexDirection:'column', gap:16}}>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Téléphone *</label>
                    <div style={{position: 'relative'}}>
                      <input type="tel" value={senderPhone} onChange={handlePhoneChange} placeholder="ex: 620..." style={{width:'100%', padding: '10px 12px', border: isKnownClient ? '2px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none'}} />
                      {isKnownClient && <CheckCircle size={18} color="#10b981" style={{position: 'absolute', right: 10, top: 10}} />}
                    </div>
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Nom Complet *</label>
                    <input type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Nom complet" style={{width:'100%', padding: '10px 12px', border: isKnownClient ? '1px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, background: isKnownClient ? '#ecfdf5' : 'white', outline:'none'}} />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Adresse (Ville, Quartier)</label>
                    <input type="text" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder="Adresse" style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none'}} />
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
                      <input type="tel" value={receiverPhone} onChange={handleReceiverPhoneChange} placeholder="Numéro du destinataire" style={{width:'100%', padding: '10px 12px', border: isKnownReceiver ? '2px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none'}} />
                      {isKnownReceiver && <CheckCircle size={18} color="#10b981" style={{position: 'absolute', right: 10, top: 10}} />}
                    </div>
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Nom Complet *</label>
                    <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Nom complet" style={{width:'100%', padding: '10px 12px', border: isKnownReceiver ? '1px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, background: isKnownReceiver ? '#ecfdf5' : 'white', outline:'none'}} />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Adresse (Ville / État) *</label>
                    <input type="text" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} placeholder="ex: Bronx, NY" style={{width:'100%', padding: '10px 12px', border: isKnownReceiver ? '1px solid #10b981' : '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, background: isKnownReceiver ? '#ecfdf5' : 'white', outline:'none'}} />
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
                    <input type="text" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ex: Vêtements, chaussures, documents..." style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none'}} />
                  </div>

                  {/* Row 2: Boxes, Weight, Transport */}
                  <div style={{display:'grid', gridTemplateColumns: '1fr 1fr 1fr', gap:16}}>
                    <div>
                      <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Nombre de Colis (Cartons)</label>
                      <input type="number" min="1" value={boxes} onChange={e=>setBoxes(e.target.value)} style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none'}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Poids Total (kg) *</label>
                      <input type="number" min="0" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="ex: 15.5" style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, outline:'none'}} />
                    </div>
                    <div>
                      <label style={{display:'block', fontSize:13, fontWeight:500, color:'#475569', marginBottom:6}}>Type de Transport</label>
                      <select value={transportType} onChange={e=>setTransportType(e.target.value)} style={{width:'100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize:14, background:'white', outline:'none', cursor:'pointer'}}>
                        <option value="AERIEN">Fret Aérien (Rapide) - 12$/kg</option>
                        <option value="MARITIME">Fret Maritime (Éco) - 5$/kg</option>
                      </select>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{height: 1, background: '#e2e8f0', margin: '8px 0'}}></div>

                  {/* Row 3: Finances */}
                  <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:24, alignItems: 'center'}}>
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
                      <div style={{display:'flex', gap:12}}>
                        <input type="number" min="0" value={amountPaid} onChange={e=>setAmountPaid(e.target.value)} placeholder="Ex: 50" style={{flex: 1, padding: '12px 16px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize:16, outline:'none'}} />
                        <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)} style={{flex: 1, padding: '12px 16px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize:14, background:'white', outline:'none', cursor:'pointer'}}>
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

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12}}>
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
        <div className="no-print" style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 50}}>
           <div style={{background:'white', width:'500px', borderRadius:'16px', padding:'24px', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)', position:'relative'}}>
              <button onClick={() => setShowReceipt(false)} style={{position:'absolute', right:16, top:16, background:'transparent', border:'none', cursor:'pointer'}}><X size={20} color="#64748b"/></button>
              
              <div style={{textAlign:'center', marginBottom: 24}}>
                 <img src="/logo.png" alt="TANGALY" style={{height:40, marginBottom: 12}}/>
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
      <div id="printable-receipt" className="print-only" style={{display: "none", fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'black'}}>
         {/* HEADER */}
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: '10px'}}>
            <div style={{textAlign: 'center', width: '25%'}}>
               <h3 style={{color: '#1d4ed8', margin: '0 0 5px 0', fontSize: '18px'}}>USA</h3>
               <p style={{margin:0, fontSize:'12px', fontWeight:'bold'}}>3429 3rd Ave.<br/>Bronx, NY 10456</p>
               <br/>
               <p style={{margin:0, fontSize:'12px', fontWeight:'bold'}}>28 Arlington Avenue<br/>Brooklyn, NY 11207</p>
               <h3 style={{color: '#dc2626', margin: '5px 0 0 0', fontSize: '16px'}}>646-382-0065</h3>
               <div style={{fontSize: '48px', marginTop: '10px'}}><img src="https://flagcdn.com/w80/us.png" alt="USA Flag" style={{width:"60px", marginTop:"10px"}}/></div>
            </div>

            <div style={{textAlign: 'center', width: '50%'}}>
               <h2 style={{color: '#16a34a', margin: 0, textTransform: 'uppercase', letterSpacing: '1px'}}>Shipping Receipt</h2>
               <div style={{border: '2px solid #dc2626', display: 'inline-block', padding: '5px 20px', marginTop: '5px'}}>
                  <h2 style={{color: '#dc2626', margin: 0}}>No. {trackingNumber}</h2>
               </div>
               
               <div style={{marginTop: '15px'}}>
                  {/* Using generic text for logo to ensure it prints well if image fails, or use img if available */}
                  <h1 style={{margin:0, color: '#1d4ed8', fontSize: '32px', fontStyle: 'italic', fontWeight: '900'}}>TANGALY</h1>
                  <h4 style={{margin:0, color: '#dc2626', fontSize: '14px'}}>SHIPPING & LOGISTICS</h4>
               </div>

               <p style={{color: '#1d4ed8', fontSize: '12px', fontWeight: 'bold', borderTop: '1px solid #1d4ed8', borderBottom: '1px solid #1d4ed8', margin: '10px 0', padding: '4px 0'}}>
                  AIR FREIGHT/USA ↔ GUINEA (CONAKRY)
               </p>
               
               <h3 style={{color: '#1d4ed8', fontStyle: 'italic', margin: '5px 0'}}>Fast, Reliable & Secure</h3>

               <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '10px', color: '#ea580c'}}>
                  <div>Zelle: <br/><span style={{color: '#4c1d95'}}>347-819-5217</span></div>
                  <div>Orange Money: <br/><span style={{color: '#ea580c'}}>611-62-53-27</span></div>
               </div>
            </div>

            <div style={{textAlign: 'center', width: '25%'}}>
               <h3 style={{color: '#1d4ed8', margin: '0 0 5px 0', fontSize: '16px'}}>Guinea (Conakry)</h3>
               <p style={{margin:0, fontSize:'12px', fontWeight:'bold'}}>Cité Enco5</p>
               <h3 style={{color: '#dc2626', margin: '5px 0 0 0', fontSize: '16px'}}>+224 626-98-52-54</h3>
               <div style={{fontSize: '48px', marginTop: '10px'}}><img src="https://flagcdn.com/w80/gn.png" alt="Guinea Flag" style={{width:"60px", marginTop:"10px"}}/></div>
               <div style={{textAlign: 'right', marginTop: '30px'}}>Date: <span style={{borderBottom: '1px solid black', padding: '0 20px'}}>{today}</span></div>
            </div>
         </div>

         {/* FORM FIELDS - Sender */}
         <div style={{marginTop: '20px'}}>
            <h4 style={{background: '#f1f5f9', fontStyle: 'italic', display: 'inline-block', padding: '2px 10px', margin: '0 0 5px 0', fontSize: '14px'}}>Sender Information / Informations de l'Expéditeur</h4>
            
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Full Name / Nom Complet: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{senderName}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Phone / Téléphone: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{senderPhone}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '15px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Address / Adresse: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{senderAddress}</div>
            </div>

            {/* FORM FIELDS - Receiver */}
            <h4 style={{background: '#f1f5f9', fontStyle: 'italic', display: 'inline-block', padding: '2px 10px', margin: '0 0 5px 0', fontSize: '14px'}}>Receiver Information / Informations du Destinataire</h4>
            
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Full Name / Nom Complet: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{receiverName}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Phone / Téléphone: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{receiverPhone}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '15px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>City (Guinea) / Ville (Guinée): </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{receiverAddress}</div>
            </div>

            {/* FORM FIELDS - Shipment Details */}
            <h4 style={{background: '#e2e8f0', fontStyle: 'italic', display: 'inline-block', padding: '2px 10px', margin: '0 0 5px 0', fontSize: '14px'}}>Shipment Details / Détails de l'Envoi</h4>
            
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Description of Goods / Description des Marchandises: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{description}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Number of Boxes / Nombre de Colis: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{boxes}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Total Weight (kg) / Poids Total (kg): </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>{weight}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Rate per kg / Tarif par kg: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>${ratePerKg}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Freight Cost / Coût du Fret: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>${freightCost}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Documentation Fee / Frais de Dossier: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px'}}>${docFee}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Total Amount / Montant Total: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px', fontWeight: 'bold'}}>${total}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '8px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Amount Paid / Montant Payé: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px', color: '#16a34a', fontWeight: 'bold'}}>${paid}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', marginBottom: '15px'}}>
               <span style={{fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap'}}>Balance Due / Reste à Payer: </span>
               <div style={{flex: 1, borderBottom: '1px solid black', marginLeft: '5px', paddingLeft: '5px', fontSize: '14px', color: '#dc2626', fontWeight: 'bold'}}>${balance}</div>
            </div>

            {/* PAYMENT METHOD */}
            <div style={{background: '#f1f5f9', padding: '10px', border: '1px solid #cbd5e1', marginBottom: '15px'}}>
               <h4 style={{margin: '0 0 10px 0', textAlign: 'center', fontSize: '14px'}}>PAYMENT METHOD / MODE DE PAIEMENT:</h4>
               <div style={{display: 'flex', justifyContent: 'space-around', fontSize: '14px', fontWeight: 'bold'}}>
                  <div>☐ CASH / ESPÈCES<br/>☐ ZELLE</div>
                  <div>☐ ORANGE MONEY<br/>☐ OTHER / AUTRE: <span style={{borderBottom: '1px solid black', padding: '0 40px'}}></span></div>
               </div>
            </div>

            {/* TERMS AND CONDITIONS */}
            <div style={{textAlign: 'center', fontSize: '11px', marginBottom: '30px'}}>
               <h4 style={{margin: '0 0 5px 0'}}>Terms & Conditions / Termes et Conditions:</h4>
               <p style={{margin: 0}}>- Tangaly Shipping is not responsible for prohibited or illegal items.</p>
               <p style={{margin: 0}}>- Tangaly Shipping is not liable for damage due to improper packaging.</p>
               <p style={{margin: 0}}>- Estimated delivery time: 5-10 business days.</p>
               <hr style={{margin: '5px auto', width: '50%', borderTop: '1px solid #cbd5e1'}} />
               <p style={{margin: 0}}>- Tangaly Shipping n'est pas responsable des articles interdits ou illégaux.</p>
               <p style={{margin: 0}}>- Tangaly Shipping n'est pas responsable des dommages dus à un mauvais emballage.</p>
               <p style={{margin: 0}}>- Délai de livraison estimé : 5-10 jours ouvrables.</p>
            </div>

            {/* SIGNATURES */}
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px'}}>
               <div style={{width: '40%', borderTop: '1px solid black', paddingTop: '5px', textAlign: 'center'}}>
                  Agent Signature / Signature de l'Agent:
               </div>
               <div style={{width: '40%', borderTop: '1px solid black', paddingTop: '5px', textAlign: 'center'}}>
                  Customer Signature / Signature du Client:
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
