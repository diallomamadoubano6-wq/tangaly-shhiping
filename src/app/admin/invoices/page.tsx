'use client';

import React, { useState, useEffect } from 'react';
import styles from '../operations.module.css';
import { Search, Filter, Printer, Eye, CheckCircle, Clock, FileText, QrCode, MessageCircle } from 'lucide-react';
import { getShipments, registerPayment } from '@/actions/shipments';
import { generateModernReceiptHTML } from '@/lib/receiptTemplate';

type Invoice = {
  id: string;
  dbId?: string;
  colis: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  description: string;
  boxes: string;
  weight: string;
  ratePerKg: number;
  freightCost: number;

  total: number;
  amountPaid: number;
  balance: number;
  date: string;
  statut: 'paid' | 'pending';
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);

  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await getShipments();
        if (res.success && res.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: Invoice[] = res.data.map((s: any) => ({
            id: s.invoice?.number || s.tracking_number,
            dbId: s.id,
            colis: s.tracking_number,
            senderName: s.client?.user?.nom || 'Inconnu',
            senderPhone: s.client?.telephone || '',
            senderAddress: s.client?.adresse || s.origine,
            receiverName: s.receiverName || 'Inconnu',
            receiverPhone: s.receiverPhone || '',
            receiverAddress: s.receiverAddress || s.destination,
            description: s.description || 'N/A',
            boxes: s.boxes?.toString() || '1',
            weight: s.poids?.toString() || '0',
            ratePerKg: s.freightCost && s.poids ? Math.round(Number(s.freightCost) / Number(s.poids)) : 0,
            freightCost: Number(s.freightCost) || 0,

            total: Number(s.invoice?.total ?? s.totalAmount) || 0,
            amountPaid: Number(s.invoice?.amountPaid ?? s.amountPaid) || 0,
            balance: Number(s.invoice?.balance ?? s.balance) || 0,
            date: new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
            statut: Number(s.invoice?.balance ?? s.balance) <= 0 ? 'paid' : 'pending'
          }));
          setInvoices(mapped);
        }
      } catch (err) {
        console.error("Failed to load invoices", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handlePaymentSubmit = async () => {
    if (!payingInvoice) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    
    try {
      const dbId = payingInvoice.dbId || payingInvoice.id; 
      const res = await registerPayment(dbId, amount, 'CASH');
      
      if (res.success) {
        // Update local state
        setInvoices(prev => prev.map(inv => {
          if (inv.id === payingInvoice.id) {
            const newPaid = inv.amountPaid + amount;
            const newBalance = inv.total - newPaid;
            return {
              ...inv,
              amountPaid: newPaid,
              balance: newBalance > 0 ? newBalance : 0,
              statut: newBalance <= 0 ? 'paid' : 'pending'
            };
          }
          return inv;
        }));
        setPayingInvoice(null);
        setPaymentAmount('');
      } else {
        alert(res.message || "Erreur lors de l'enregistrement du paiement");
      }
    } catch (error) {
      console.error("Erreur de paiement:", error);
      alert("Erreur réseau");
    }
  };


  const getReceiptHTML = (inv: Invoice) => {
    return generateModernReceiptHTML({
      id: inv.id,
      colis: inv.colis,
      date: inv.date,
      senderName: inv.senderName,
      senderPhone: inv.senderPhone,
      senderAddress: inv.senderAddress,
      receiverName: inv.receiverName,
      receiverPhone: inv.receiverPhone,
      receiverAddress: inv.receiverAddress,
      description: inv.description,
      boxes: Number(inv.boxes) || 1,
      weight: Number(inv.weight) || 0,
      ratePerKg: inv.ratePerKg,
      freightCost: inv.freightCost,
      total: inv.total,
      amountPaid: inv.amountPaid,
      balance: inv.balance,
      typeTransport: 'AERIEN'
    });
  };

  const handlePrint = (inv: Invoice) => {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>Facture - ${inv.colis || inv.id}</title>
      <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        @page { size: A4 portrait; margin: 8mm 10mm; }
        body { margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; }
      </style>
      </head><body>
    `);
    win.document.write(getReceiptHTML(inv));
    win.document.write(`
      <script>
        window.onload = () => { setTimeout(() => window.print(), 300); }
      </script>
      </body></html>
    `);
    win.document.close();
  };

  const handleWhatsAppShare = (inv: Invoice) => {
    const text = `Bonjour ${inv.senderName},\n\nVoici les détails de votre expédition chez Tangaly Shipping.\n\n📦 Colis N°: ${inv.id}\n📍 Destination: ${inv.receiverAddress}\n⚖️ Poids: ${inv.weight} KG\n\n💵 Montant Total: $${inv.total}\n✅ Montant Payé: $${inv.amountPaid}\n⏳ Reste à payer: $${inv.balance}\n\nMerci de votre confiance !`;
    const encoded = encodeURIComponent(text);
    let phone = inv.senderPhone.replace(/\\D/g, '');
    if (phone.startsWith('00')) {
      phone = phone.substring(2);
    }
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handlePrintQR = (inv: Invoice) => {
    const win = window.open('', '_blank', 'width=600,height=800');
    if (!win) return;
    win.document.write(`
      <html><head><title>Étiquette ${inv.id}</title>
      <style>
        body { margin: 0; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; display: flex; justify-content: center; background: #f1f5f9; }
        .label-container { background: white; border: 2px solid #000; width: 4in; height: 6in; padding: 0.15in; box-sizing: border-box; display: flex; flex-direction: column; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 900; font-style: italic; letter-spacing: -1px; }
        .header p { margin: 0; font-size: 10px; font-weight: bold; }
        .addresses { display: flex; flex-direction: column; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; flex-grow: 1; justify-content: space-evenly; }
        .sender { font-size: 12px; }
        .receiver { font-size: 14px; margin-left: 20px; font-weight: bold; }
        .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; color: #555; }
        .details { display: flex; justify-content: space-between; font-size: 12px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
        .details-box { display: flex; flex-direction: column; }
        .qr-section { display: flex; justify-content: space-between; align-items: center; margin-top: auto; margin-bottom: 10px; }
        .qr-code { width: 1.3in; height: 1.3in; }
        .tracking-info { text-align: right; }
        .tracking-info h2 { margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px; }
        .footer-text { text-align: center; font-size: 10px; margin-top: 5px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; }
        
        @media print {
          @page { margin: 0; size: 4in 6in; }
          body { padding: 0; background: white; display: block; }
          .label-container { border: none; box-shadow: none; width: 100%; height: 100%; padding: 0.1in; }
        }
      </style>
      </head><body>
      <div class="label-container">
        <div class="header">
          <div>
            <h1>TANGALY</h1>
            <p>SHIPPING & LOGISTICS</p>
          </div>
          <div style="text-align: right; align-self: flex-end; font-size: 10px; font-weight: bold; color: #111;">
            <p style="margin: 0 0 2px 0;">USA: 646-382-0065</p>
            <p style="margin: 0 0 2px 0;">GN: +224 626-98-52-54</p>
            <p style="margin: 4px 0 0 0; color: #555;">DATE: ${inv.date}</p>
          </div>
        </div>

        <div class="addresses">
          <div class="sender">
            <p class="section-title">FROM / EXPÉDITEUR :</p>
            <p style="margin: 0; font-weight: bold; font-size: 14px;">${inv.senderName}</p>
            <p style="margin: 0;">${inv.senderPhone}</p>
            <p style="margin: 0;">${inv.senderAddress}</p>
          </div>
          <div class="receiver">
            <p class="section-title">TO / DESTINATAIRE :</p>
            <p style="margin: 0; font-size: 20px; font-weight: 900;">${inv.receiverName}</p>
            <p style="margin: 0; font-size: 16px;">${inv.receiverPhone}</p>
            <p style="margin: 0;">${inv.receiverAddress}</p>
          </div>
        </div>

        <div class="details">
          <div class="details-box" style="flex: 1; padding-right: 10px;">
            <p class="section-title">DESCRIPTION</p>
            <p style="margin: 0; font-weight: bold; font-size: 14px;">${inv.description}</p>
          </div>
          <div class="details-box" style="text-align: right;">
            <p class="section-title">WEIGHT / POIDS</p>
            <p style="margin: 0; font-weight: 900; font-size: 18px;">${inv.weight} KG</p>
            <p class="section-title" style="margin-top: 8px;">PIECES / COLIS</p>
            <p style="margin: 0; font-weight: 900; font-size: 18px;">${inv.boxes}</p>
          </div>
        </div>

        <div class="qr-section">
          <img id="qr-img" class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inv.colis || inv.id)}" alt="QR Code" />
          <div class="tracking-info">
            <p class="section-title">TRACKING NO. / SUIVI</p>
            <h2>${inv.colis || inv.id}</h2>
          </div>
        </div>

        <div class="footer-text">
          PLEASE SCAN THIS QR CODE TO UPDATE SHIPMENT STATUS
        </div>
      </div>
      <script>
        const img = document.getElementById('qr-img');
        if (img.complete) {
          setTimeout(() => window.print(), 200);
        } else {
          img.onload = () => setTimeout(() => window.print(), 200);
          img.onerror = () => setTimeout(() => window.print(), 200);
        }
      </script>
      </body></html>
    `);
    win.document.close();
  };


  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Factures & Reçus Clients</h1>
          <p className={styles.pageSubtitle}>Consultez et imprimez les reçus d&apos;expédition (&quot;Shipping Receipts&quot;).</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Rechercher un reçu, un colis..." className={styles.searchInput} />
          </div>
          <button className={styles.secondaryButton}>
            <Filter size={18} /> Filtrer
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table} style={{tableLayout: 'fixed', width: '100%'}}>
            <thead>
              <tr>
                <th style={{width: '140px'}}>Reçu N°</th>
                <th style={{width: '130px'}}>Colis</th>
                <th>Expéditeur</th>
                <th style={{width: '90px'}}>Montant</th>
                <th style={{width: '110px'}}>Date</th>
                <th style={{width: '110px'}}>Statut</th>
                <th style={{width: '240px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{padding:20, textAlign:'center'}}>Chargement des factures...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} style={{padding:20, textAlign:'center'}}>Aucune facture trouvée</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} style={{verticalAlign: 'middle'}}>
                  <td style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}><strong>#{inv.id}</strong></td>
                  <td style={{color: '#2563eb', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{inv.colis}</td>
                  <td style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{inv.senderName}</td>
                  <td style={{fontWeight: 700, whiteSpace: 'nowrap'}}>${inv.total}</td>
                  <td style={{whiteSpace: 'nowrap', fontSize: 13, color: '#475569'}}>{inv.date}</td>
                  <td>
                    {inv.statut === 'paid'
                      ? <span className={`${styles.badge} ${styles.badgeSuccess}`}><CheckCircle size={13}/> Payée</span>
                      : <span className={`${styles.badge} ${styles.badgeWarning}`}><Clock size={13}/> En attente</span>
                    }
                  </td>
                  <td style={{display:'flex', gap:6, alignItems: 'center'}}>
                    {inv.balance > 0 && (
                      <button className={styles.primaryButton} style={{padding:'5px 10px', fontSize:12, background:'#16a34a', whiteSpace:'nowrap'}} onClick={() => { setPayingInvoice(inv); setPaymentAmount(''); }}>
                        Encaisser
                      </button>
                    )}
                    <button className={styles.textButton} style={{padding:'5px 8px', fontSize:12, whiteSpace:'nowrap'}} onClick={() => setSelected(inv)}>
                      <Eye size={14}/> Voir
                    </button>
                    <button className={styles.secondaryButton} style={{padding:'5px 8px', fontSize:12, whiteSpace:'nowrap'}} onClick={() => setPrintingInvoice(inv)}>
                      <Printer size={14}/> Imprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Voir Détails (Résumé propre) */}
      {selected && (
        <div className={styles.modalOverlay} style={{ zIndex: 1000, overflowY: 'auto', padding: '20px 0' }}>
          <div className={styles.modalContent} style={{ maxWidth: 860, width: '95%', padding: 0, borderRadius: 16, overflow: 'hidden', margin: 'auto' }}>
            
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Eye size={20} color="#1d4ed8" />
                <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a', fontWeight: 700 }}>
                  Aperçu du Reçu Officiel · N° {selected.colis || selected.id}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => handleWhatsAppShare(selected)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button
                  onClick={() => handlePrint(selected)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Printer size={16} /> Imprimer (A4)
                </button>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: '#e2e8f0', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', color: '#475569', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div style={{ padding: '20px', background: '#f1f5f9', maxHeight: '78vh', overflowY: 'auto' }}>
              <div style={{ background: 'white', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', padding: 12 }}>
                <div dangerouslySetInnerHTML={{ __html: getReceiptHTML(selected) }} />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Encaisser Paiement */}
      {payingInvoice && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth: 400}}>
            <div className={styles.modalHeader}>
              <h2>Enregistrer un paiement</h2>
              <button className={styles.closeButton} onClick={() => setPayingInvoice(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div style={{background:'#fef2f2', padding:16, borderRadius:8, marginBottom:20, border:'1px dashed #ef4444'}}>
                <p style={{margin:0, fontSize:13, color:'#991b1b'}}>Reste à payer (Facture #{payingInvoice.id})</p>
                <p style={{margin:0, fontSize:24, fontWeight:800, color:'#dc2626'}}>\${payingInvoice.balance}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Montant reçu aujourd&apos;hui (USD)</label>
                <input type="number" className={styles.input} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={payingInvoice.balance} />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Mode de paiement</label>
                <select className={styles.input}>
                  <option>Espèces (CASH)</option>
                  <option>Zelle</option>
                  <option>Orange Money</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={() => setPayingInvoice(null)}>Annuler</button>
              <button className={styles.primaryButton} style={{background:'#16a34a'}} onClick={handlePaymentSubmit}>
                Valider le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Options d'impression */}
      {printingInvoice && (
        <div className={styles.modalOverlay} style={{backdropFilter: 'blur(4px)'}}>
          <div className={styles.modalContent} style={{maxWidth: 420, padding: 0, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}}>
            
            <div style={{background: 'linear-gradient(to right, #1e3a8a, #2563eb)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white'}}>
              <h2 style={{margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700}}>
                <Printer size={24} style={{opacity: 0.9}}/> Impression
              </h2>
              <button onClick={() => setPrintingInvoice(null)} style={{background: 'rgba(255,255,255,0.2)', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', transition: 'all 0.2s'}}>
                ✕
              </button>
            </div>
            
            <div style={{padding: '32px 24px'}}>
              <p style={{color: '#475569', fontSize: 15, marginBottom: 24, textAlign: 'center', lineHeight: 1.5}}>
                Que souhaitez-vous imprimer pour l&apos;envoi <br/>
                <strong style={{color: '#0f172a', fontSize: 18, display: 'inline-block', marginTop: 8, padding: '4px 12px', background: '#f1f5f9', borderRadius: 8}}>{printingInvoice.id}</strong> ?
              </p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
                <button 
                  onClick={() => { handlePrint(printingInvoice); setPrintingInvoice(null); }}
                  style={{
                    padding: '16px', display: 'flex', alignItems: 'center', gap: 16, background: '#ffffff', 
                    border: '2px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                    textAlign: 'left', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                >
                  <div style={{background: '#eff6ff', padding: 12, borderRadius: 10, color: '#2563eb'}}>
                    <FileText size={24}/>
                  </div>
                  <div>
                    <h3 style={{margin: '0 0 4px 0', color: '#0f172a', fontSize: 16}}>Reçu Complet (A4)</h3>
                    <p style={{margin: 0, color: '#64748b', fontSize: 13}}>Format standard pour le client</p>
                  </div>
                </button>

                <button 
                  onClick={() => { handlePrintQR(printingInvoice); setPrintingInvoice(null); }}
                  style={{
                    padding: '16px', display: 'flex', alignItems: 'center', gap: 16, background: '#ffffff', 
                    border: '2px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                    textAlign: 'left', width: '100%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ea580c'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(234, 88, 12, 0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                >
                  <div style={{background: '#fff7ed', padding: 12, borderRadius: 10, color: '#ea580c'}}>
                    <QrCode size={24}/>
                  </div>
                  <div>
                    <h3 style={{margin: '0 0 4px 0', color: '#0f172a', fontSize: 16}}>Étiquette QR Code</h3>
                    <p style={{margin: 0, color: '#64748b', fontSize: 13}}>Format sticker pour le colis</p>
                  </div>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
