'use client';
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { Shield, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { updateProfile, updatePassword } from '@/actions/settings';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      setNom(user.nom || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    const res = await updateProfile(nom, email);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      await update({ nom, email });
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      setMessage({ text: 'Les mots de passe ne correspondent pas.', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: 'Le mot de passe doit faire au moins 6 caractères.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage({ text: '', type: '' });
    const res = await updatePassword(password);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Paramètres du Compte</h2>
          <p className={styles.cardSubtitle}>Gérez vos informations personnelles et vos préférences.</p>
        </div>
      </div>
      
      {message.text && (
        <div style={{ padding: '12px 16px', marginBottom: 20, borderRadius: 8, background: message.type === 'success' ? '#dcfce7' : '#fef2f2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
          {message.text}
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24}}>
         <div className={styles.chartCard}>
            <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:16, marginBottom:24, color:'#0f172a'}}><User size={18}/> Mon Profil</h3>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
               <div>
                 <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Nom complet</label>
                 <input type="text" value={nom} onChange={e => setNom(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14, boxSizing:'border-box'}} />
               </div>
               <div>
                 <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Email</label>
                 <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14, boxSizing:'border-box'}} />
               </div>
               <button className={styles.primaryButton} onClick={handleUpdateProfile} disabled={loading} style={{alignSelf:'flex-start'}}>
                 {loading ? 'Enregistrement...' : 'Sauvegarder'}
               </button>
            </div>
         </div>
         
         <div className={styles.chartCard}>
            <h3 style={{display:'flex', alignItems:'center', gap:8, fontSize:16, marginBottom:24, color:'#0f172a'}}><Shield size={18}/> Sécurité</h3>
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
               <div>
                 <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Nouveau mot de passe</label>
                 <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14, boxSizing:'border-box'}} />
               </div>
               <div>
                 <label style={{display:'block', marginBottom:8, fontSize:14, fontWeight:500, color:'#334155'}}>Confirmer le mot de passe</label>
                 <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', fontSize:14, boxSizing:'border-box'}} />
               </div>
               <button onClick={handleUpdatePassword} disabled={loading} style={{padding:'10px 16px', background:'#0f172a', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500, alignSelf:'flex-start'}}>
                 {loading ? 'Mise à jour...' : 'Mettre à jour'}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
