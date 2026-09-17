'use client';
import { useState } from 'react';
import styles from '../operations.module.css';
import { Calculator } from 'lucide-react';

export default function CalculatorPage() {
  const [weight, setWeight] = useState(0);
  const [destination, setDestination] = useState('États-Unis (USA)');
  
  const isGuinea = destination === 'Guinée (Conakry)';
  const priceUSD = weight * 12;
  const priceGNF = priceUSD * 8500;

  return (
    <div className={styles.dashboard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Calculateur de Prix</h2>
          <p className={styles.cardSubtitle}>Estimez rapidement les frais d'expédition pour un client au comptoir.</p>
        </div>
      </div>
      
      <div className={styles.chartCard} style={{maxWidth: 600}}>
         <div style={{display:'flex', flexDirection:'column', gap: 20}}>
            <div>
               <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Destination</label>
               <select value={destination} onChange={(e) => setDestination(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14, background:'white'}}>
                  <option>États-Unis (USA)</option>
                  <option>Guinée (Conakry)</option>
               </select>
            </div>
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
               <div>
                  <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Poids (kg)</label>
                  <input type="number" min="0" value={weight} onChange={(e) => setWeight(Number(e.target.value))} style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14}} />
               </div>
               <div>
                  <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Type de fret</label>
                  <select style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14, background:'white'}}>
                     <option>Aérien (Rapide)</option>
                     <option>Maritime (Éco)</option>
                  </select>
               </div>
            </div>
            
            <div style={{marginTop: 16, padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center'}}>
               <p style={{margin:0, fontSize:14, color:'#64748b'}}>Prix Estimé</p>
               {isGuinea ? (
                 <>
                   <h2 style={{margin:'8px 0 0', fontSize:32, color:'#2563eb'}}>{priceGNF.toLocaleString()} GNF</h2>
                   <p style={{margin:'4px 0 0', fontSize:12, color:'#94a3b8'}}>Soit env. {priceUSD.toLocaleString()} $</p>
                 </>
               ) : (
                 <>
                   <h2 style={{margin:'8px 0 0', fontSize:32, color:'#2563eb'}}>{priceUSD.toLocaleString()} $</h2>
                   <p style={{margin:'4px 0 0', fontSize:12, color:'#94a3b8'}}>Soit env. {priceGNF.toLocaleString()} GNF</p>
                 </>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
