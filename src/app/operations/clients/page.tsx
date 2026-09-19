'use client';
import { useState } from 'react';
import styles from '../operations.module.css';
import { UserPlus, Search, X, History } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState([
    { id: "CL-001", name: "Mamadou Diallo", phone: "620123456", email: "mamadou@email.com", address: "Dixinn, Conakry", totalShipments: 12 },
    { id: "CL-002", name: "Fatoumata Camara", phone: "621987654", email: "fatou.c@email.com", address: "Kipé, Conakry", totalShipments: 5 },
    { id: "CL-003", name: "Ousmane Sylla", phone: "628112233", email: "ousmane@email.com", address: "Kaloum, Conakry", totalShipments: 2 }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAddClient = () => {
    if(!newName || !newPhone) return;
    setClients([
      { 
        id: `CL-00${clients.length + 1}`, 
        name: newName, 
        phone: newPhone, 
        email: "", 
        address: newAddress, 
        totalShipments: 0 
      },
      ...clients
    ]);
    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewAddress('');
  };

  const openHistory = (client: any) => {
    setSelectedClient(client);
    setShowHistoryModal(true);
  };

  return (
    <>
      <div className={styles.cardHeader} style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap: 16}}>
        <div>
          <h2 className={styles.cardTitle}>Gestion des Clients</h2>
          <p className={styles.cardSubtitle}>Annuaire des expéditeurs et destinataires.</p>
        </div>
        <div style={{display:'flex', gap:12, flexWrap:'wrap', alignItems:'center'}}>
          <div className={styles.searchBox} style={{display:'flex', alignItems:'center', background:'white', padding:'8px 12px', borderRadius:8, border:'1px solid #cbd5e1', flex:'1 1 200px', minWidth: 180}}>
            <Search size={18} color="#64748b" style={{marginRight:8}} />
            <input type="text" placeholder="Rechercher (Nom, N° Tel)" style={{border:'none', outline:'none', background:'transparent', width:'100%'}} />
          </div>
          <button onClick={() => setShowAddModal(true)} className={styles.primaryButton} >
            <UserPlus size={18} /> Nouveau Client
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Client</th>
              <th>Nom Complet</th>
              <th>Téléphone</th>
              <th>Adresse</th>
              <th>Expéditions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => (
              <tr key={i}>
                <td style={{fontWeight:500, color:'#0f172a'}}>{c.id}</td>
                <td style={{fontWeight:600}}>{c.name}</td>
                <td>{c.phone}</td>
                <td style={{color:'#64748b'}}>{c.address}</td>
                <td>{c.totalShipments} colis</td>
                <td>
                  <button onClick={() => openHistory(c)} className={styles.textButton}>Voir historique</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Ajout Client */}
      {showAddModal && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{backgroundColor:'white', padding:32, borderRadius:16, width:'400px', maxWidth:'90%'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <h2 style={{margin:0, fontSize:'1.25rem', color:'#0f172a'}}>Nouveau Client</h2>
              <button onClick={() => setShowAddModal(false)} className={styles.closeButton}><X size={24}/></button>
            </div>
            
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <div>
                <label style={{display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:8, color:'#475569'}}>Nom complet *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Amadou Bah" style={{width:'100%', padding:'10px', borderRadius:8, border:'1px solid #cbd5e1'}} />
              </div>
              <div>
                <label style={{display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:8, color:'#475569'}}>Téléphone *</label>
                <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Ex: 620..." style={{width:'100%', padding:'10px', borderRadius:8, border:'1px solid #cbd5e1'}} />
              </div>
              <div>
                <label style={{display:'block', fontSize:'0.875rem', fontWeight:500, marginBottom:8, color:'#475569'}}>Adresse</label>
                <input type="text" value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Ex: Kipé" style={{width:'100%', padding:'10px', borderRadius:8, border:'1px solid #cbd5e1'}} />
              </div>
              <button onClick={handleAddClient} className={styles.primaryButton} style={{width:'100%', marginTop:8}}>Enregistrer le client</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique Client */}
      {showHistoryModal && selectedClient && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{backgroundColor:'white', padding:32, borderRadius:16, width:'600px', maxWidth:'95%', maxHeight:'90vh', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
              <div>
                <h2 style={{margin:0, fontSize:'1.25rem', color:'#0f172a'}}>Historique : {selectedClient.name}</h2>
                <p style={{margin:0, color:'#64748b', fontSize:'0.875rem'}}>Téléphone: {selectedClient.phone}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className={styles.closeButton}><X size={24}/></button>
            </div>
            
            {selectedClient.totalShipments > 0 ? (
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid #e2e8f0', textAlign:'left', color:'#64748b', fontSize:'0.875rem'}}>
                    <th style={{paddingBottom:8}}>ID Colis</th>
                    <th style={{paddingBottom:8}}>Date</th>
                    <th style={{paddingBottom:8}}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{borderBottom:'1px solid #f1f5f9'}}>
                    <td style={{padding:'12px 0', fontWeight:500}}>TGL-9921</td>
                    <td style={{padding:'12px 0'}}>10 Sep 2026</td>
                    <td style={{padding:'12px 0'}}><span style={{background:'#dbeafe', color:'#1e3a8a', padding:'4px 8px', borderRadius:4, fontSize:'0.75rem'}}>En Transit</span></td>
                  </tr>
                  <tr>
                    <td style={{padding:'12px 0', fontWeight:500}}>TGL-7734</td>
                    <td style={{padding:'12px 0'}}>01 Aou 2026</td>
                    <td style={{padding:'12px 0'}}><span style={{background:'#dcfce7', color:'#166534', padding:'4px 8px', borderRadius:4, fontSize:'0.75rem'}}>Livré</span></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div style={{textAlign:'center', padding:'32px 0', color:'#64748b'}}>
                <History size={48} opacity={0.2} style={{marginBottom:16}} />
                <p>Aucune expédition trouvée pour ce client.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
