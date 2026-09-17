'use client';
import styles from '../operations.module.css';
import { Settings, Shield, User } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Paramètres du Compte</h2>
          <p className={styles.cardSubtitle}>Gérez vos informations personnelles et vos préférences.</p>
        </div>
      </div>
      
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
         <div className={styles.chartCard}>
            <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:16, marginBottom:24, color:'#0f172a'}}><User size={18}/> Mon Profil</h3>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
               <div>
                 <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Nom complet</label>
                 <input type="text" defaultValue="Mamadou Diallo" style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14}} />
               </div>
               <div>
                 <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Email</label>
                 <input type="email" defaultValue="diallo@tangaly.com" style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14}} />
               </div>
               <button className={styles.primaryButton}>Sauvegarder</button>
            </div>
         </div>
         
         <div className={styles.chartCard}>
            <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:16, marginBottom:24, color:'#0f172a'}}><Shield size={18}/> Sécurité</h3>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
               <div>
                 <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Nouveau mot de passe</label>
                 <input type="password" placeholder="••••••••" style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14}} />
               </div>
               <div>
                 <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Confirmer le mot de passe</label>
                 <input type="password" placeholder="••••••••" style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14}} />
               </div>
               <button style={{padding:'10px 16px', background:'#0f172a', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, alignSelf:'flex-start'}}>Mettre à jour</button>
            </div>
         </div>
      </div>
    </div>
  );
}
