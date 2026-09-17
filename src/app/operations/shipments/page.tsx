'use client';
import styles from '../operations.module.css';
import { Search, Filter, Edit3, QrCode } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { QRCodeCanvas } from 'qrcode.react';

export default function ShipmentsPageWrapper() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ShipmentsPage />
    </Suspense>
  );
}

function ShipmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('status') || 'ALL';
  
  const [qrModal, setQrModal] = useState<{ open: boolean; shipment: any | null }>({ open: false, shipment: null });
  const [statusModal, setStatusModal] = useState<{ open: boolean; shipment: any | null }>({ open: false, shipment: null });
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [newStatus, setNewStatus] = useState('');

  const STATUS_LABELS: Record<string, string> = {
    CREATED: 'Enregistré',
    RECEIVED: 'Réceptionné',
    PREPARING: 'En attente d\'expédition',
    SHIPPED: 'En transit',
    ARRIVED: 'Arrivé à destination',
    DELIVERED: 'Livré au destinataire',
    RETURNED: 'Retourné'
  };

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem('tangaly_client_token') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/shipments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
         const formatted = json.data.map((s: any) => ({
           id: s.tracking_number,
           dbId: s.id,
           client: s.client?.user?.nom || 'Inconnu',
           orig: s.origine,
           dest: s.destination,
           status: s.statut,
           statusLabel: STATUS_LABELS[s.statut] || s.statut,
           date: new Date(s.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
           color: (s.statut === 'EN_TRANSIT' || s.statut === 'TRANSIT' || s.statut === 'SHIPPED') ? 'transit' : ((s.statut === 'LIVRE' || s.statut === 'DELIVERED') ? 'livre' : 'prep')
         }));
         setShipments(formatted);
      }
    } catch (err) {
      console.error("Failed to load shipments", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Met à jour le filtre si l'URL change (clic depuis le menu latéral)
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    } else {
      setStatusFilter('ALL');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal.shipment || !newStatus) return;
    
    try {
      const token = localStorage.getItem('tangaly_client_token') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/shipments/${statusModal.shipment.dbId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statut: newStatus })
      });
      
      const json = await res.json();
      if (json.success) {
        setStatusModal({ open: false, shipment: null });
        setNewStatus('');
        fetchShipments(); // refresh
      } else {
        alert(json.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur réseau");
    }
  };

  const filteredShipments = shipments.filter(s => {
    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!s.id.toLowerCase().includes(q) && !s.client.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== 'ALL') {
      const isPending = ['CREATED', 'PENDING', 'PREPARATION', 'EN_ATTENTE', 'PREPARING', 'RECEIVED'].includes(s.status);
      const isTransit = ['TRANSIT', 'EN_TRANSIT', 'SHIPPED'].includes(s.status);
      const isDelivered = ['LIVRE', 'DELIVERED'].includes(s.status);
      
      if (statusFilter === 'pending' && !isPending) return false;
      if (statusFilter === 'transit' && !isTransit) return false;
      if (statusFilter === 'delivered' && !isDelivered) return false;
    }
    
    return true;
  });

  return (
    <div className={styles.dashboard}>
      <div className={styles.cardHeader} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h2 className={styles.cardTitle}>Liste des Expéditions</h2>
          <p className={styles.cardSubtitle}>Gérez et suivez tous les colis de l'agence.</p>
        </div>
        <div style={{display:'flex', gap:12}}>
           <div style={{position:'relative'}}>
             <div style={{position:'absolute', left:12, top:10}}><Search size={16} color="#94a3b8"/></div>
             <input 
               type="text" 
               placeholder="Rechercher (N°, Client)" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               style={{padding:'8px 12px 8px 36px', borderRadius:'8px', border:'1px solid #cbd5e1', outline:'none', fontSize:14, width:250}} 
             />
           </div>
           <select 
             value={statusFilter} 
             onChange={(e) => setStatusFilter(e.target.value)}
             style={{padding:'8px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', outline:'none', fontSize:14, background:'white', cursor:'pointer'}}
           >
             <option value="ALL">Tous les statuts</option>
             <option value="pending">En attente / Préparation</option>
             <option value="transit">En Transit</option>
             <option value="delivered">Livrés</option>
           </select>
        </div>
      </div>
      
      <div className={styles.chartCard} style={{padding: 0, overflow: 'hidden'}}>
         <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14}}>
            <thead style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13, textTransform: 'uppercase'}}>
               <tr>
                  <th style={{padding: '16px 24px', fontWeight: 600}}>N° Suivi</th>
                  <th style={{padding: '16px 24px', fontWeight: 600}}>Client</th>
                  <th style={{padding: '16px 24px', fontWeight: 600}}>Trajet</th>
                  <th style={{padding: '16px 24px', fontWeight: 600}}>Date</th>
                  <th style={{padding: '16px 24px', fontWeight: 600}}>Statut</th>
                  <th style={{padding: '16px 24px', fontWeight: 600}}>Actions</th>
               </tr>
            </thead>
            <tbody>
               {isLoading ? (
                 <tr><td colSpan={6} style={{padding:'20px', textAlign:'center'}}>Chargement des expéditions...</td></tr> 
               ) : filteredShipments.length === 0 ? (
                 <tr><td colSpan={6} style={{padding:'20px', textAlign:'center', color:'#64748b'}}>Aucune expédition trouvée.</td></tr>
               ) : filteredShipments.map((s, i) => (
                 <tr key={i} style={{borderBottom: '1px solid #f1f5f9'}}>
                    <td style={{padding: '16px 24px', fontWeight: 500, color: '#0f172a'}}>{s.id}</td>
                    <td style={{padding: '16px 24px', color: '#334155'}}>{s.client}</td>
                    <td style={{padding: '16px 24px', color: '#64748b'}}>{s.orig} ➔ {s.dest}</td>
                    <td style={{padding: '16px 24px', color: '#64748b'}}>{s.date}</td>
                    <td style={{padding: '16px 24px'}}>
                       <span className={`${styles.statusBadge} ${styles['status-' + s.color]}`}>{s.statusLabel}</span>
                    </td>
                    <td style={{padding: '16px 24px', display:'flex', gap:8, alignItems:'center'}}>
                       <button 
                         onClick={() => { setStatusModal({ open: true, shipment: s }); setNewStatus(s.status); }}
                         style={{
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           width: '32px', height: '32px', borderRadius: '6px',
                           background: '#eff6ff', border: '1px solid #bfdbfe',
                           color: '#2563eb', cursor: 'pointer', transition: 'all 0.2s'
                         }}
                         title="Changer le statut"
                       >
                         <Edit3 size={16}/>
                       </button>
                       <button 
                         onClick={() => setQrModal({ open: true, shipment: s })}
                         style={{
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           width: '32px', height: '32px', borderRadius: '6px',
                           background: '#f8fafc', border: '1px solid #e2e8f0',
                           color: '#475569', cursor: 'pointer', transition: 'all 0.2s'
                         }}
                         title="Afficher Code QR"
                       >
                         <QrCode size={16}/>
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      <Modal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, shipment: null })}
        title={`Code QR — ${qrModal.shipment?.id}`}
        footer={
          <button style={{padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}} onClick={() => setQrModal({ open: false, shipment: null })}>Fermer</button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '2rem 1rem' }}>
          {qrModal.shipment && (
            <>
              <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <QRCodeCanvas value={qrModal.shipment.id} size={220} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: '#0f172a' }}>
                  {qrModal.shipment.id}
                </p>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  Scannez ce code pour mettre à jour son statut depuis l'outil de scan.
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal pour changer le statut */}
      <Modal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, shipment: null })}
        title={`Modifier le statut : ${statusModal.shipment?.id}`}
        footer={null}
      >
        <form onSubmit={handleUpdateStatus} style={{padding: '1rem'}}>
          <p style={{marginBottom: 16, color: '#64748b', fontSize: 14}}>
            Statut actuel : <strong style={{color: '#0f172a'}}>{statusModal.shipment?.status}</strong>
          </p>
          <div style={{marginBottom: 20}}>
            <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:600}}>Nouveau statut</label>
            <select 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
              style={{width: '100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', outline:'none', fontSize:14}}
            >
              <option value="PREPARING">En attente d'expédition</option>
              <option value="SHIPPED">En transit</option>
              <option value="DELIVERED">Livré au destinataire</option>
              <option value="RETURNED">Retourné</option>
            </select>
          </div>
          <div style={{display:'flex', gap:10, justifyContent:'flex-end'}}>
            <button type="button" onClick={() => setStatusModal({ open: false, shipment: null })} style={{padding: '10px 16px', background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Annuler</button>
            <button type="submit" style={{padding: '10px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600}}>Mettre à jour</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
