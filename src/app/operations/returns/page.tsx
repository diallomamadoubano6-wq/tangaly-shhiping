'use client';
import styles from '../operations.module.css';
import { RotateCcw, Search } from 'lucide-react';

export default function ReturnsPage() {
  const dummyReturns = [
    { id: "TGL-587800", client: "Fatoumata Camara", reason: "Destinataire injoignable", date: "02 Sep 2026", status: "EN_ATTENTE_CLIENT" },
    { id: "TGL-587801", client: "Amadou Diallo", reason: "Adresse incorrecte", date: "01 Sep 2026", status: "RETOURNE_AGENCE" }
  ];

  return (
    <>
      <div className={styles.cardHeader} style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16}}>
        <div>
          <h2 className={styles.cardTitle}>Colis Retournés</h2>
          <p className={styles.cardSubtitle}>Gérez les expéditions non livrées ou retournées par le destinataire.</p>
        </div>
        <div style={{display:'flex', gap:12, flexWrap:'wrap', alignItems:'center'}}>
           <div style={{position:'relative', width: 250, maxWidth: '100%'}}>
             <div style={{position:'absolute', left:12, top:10}}><Search size={16} color="#94a3b8"/></div>
             <input type="text" placeholder="Rechercher (N° Suivi)" style={{padding:'8px 12px 8px 36px', borderRadius:'8px', border:'1px solid #cbd5e1', outline:'none', fontSize:14, width:'100%', boxSizing:'border-box'}} />
           </div>
        </div>
      </div>
      
      <div className={styles.chartCard} style={{padding: 0}}>
        <div className={styles.tableWrapper}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14, minWidth: 600}}>
             <thead style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 13, textTransform: 'uppercase'}}>
                <tr>
                   <th style={{padding: '16px 24px', fontWeight: 600}}>N° Suivi</th>
                   <th style={{padding: '16px 24px', fontWeight: 600}}>Client expéditeur</th>
                   <th style={{padding: '16px 24px', fontWeight: 600}}>Motif du retour</th>
                   <th style={{padding: '16px 24px', fontWeight: 600}}>Date de retour</th>
                   <th style={{padding: '16px 24px', fontWeight: 600}}>Statut actuel</th>
                </tr>
             </thead>
             <tbody>
                {dummyReturns.map((s, i) => (
                  <tr key={i} style={{borderBottom: '1px solid #f1f5f9'}}>
                     <td style={{padding: '16px 24px', fontWeight: 500, color: '#0f172a'}}>{s.id}</td>
                     <td style={{padding: '16px 24px', color: '#334155'}}>{s.client}</td>
                     <td style={{padding: '16px 24px', color: '#dc2626'}}>{s.reason}</td>
                     <td style={{padding: '16px 24px', color: '#64748b'}}>{s.date}</td>
                     <td style={{padding: '16px 24px'}}>
                        <span style={{background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '999px', fontSize: 12, fontWeight: 500}}>{s.status.replace(/_/g, ' ')}</span>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
