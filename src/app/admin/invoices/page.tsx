'use client';

import React, { useState, useEffect } from 'react';
import styles from '../operations.module.css';
import { Search, Filter, Printer, Eye, CheckCircle, Clock, FileText, QrCode, MessageCircle } from 'lucide-react';
import { getShipments, registerPayment } from '@/actions/shipments';
import { generateModernReceiptHTML } from '@/lib/receiptTemplate';
import { printShippingLabel } from '@/lib/shippingLabelTemplate';

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
      <base href="${window.location.origin}/">
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
    printShippingLabel({
      trackingNumber: inv.colis || inv.id,
      senderName: inv.senderName,
      senderPhone: inv.senderPhone,
      senderAddress: inv.senderAddress,
      receiverName: inv.receiverName,
      receiverPhone: inv.receiverPhone,
      receiverAddress: inv.receiverAddress,
      description: inv.description,
      weight: inv.weight,
      boxes: inv.boxes,
      date: inv.date,
    });
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
