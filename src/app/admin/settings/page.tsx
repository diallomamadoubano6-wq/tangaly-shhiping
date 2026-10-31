'use client';
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { Shield, User, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { updateProfile, updatePassword, resetDatabaseAction } from '@/actions/settings';
import { useToast, useConfirm } from '@/components/ui/ToastProvider';

interface UserSession {
  nom?: string;
  email?: string;
  role?: string;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user as UserSession | undefined;
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // État pour la remise à zéro de la base de données
  const [resetLoading, setResetLoading] = useState(false);
  const [keepArticles, setKeepArticles] = useState(true);

  useEffect(() => {
    if (user) {
      const t = setTimeout(() => {
        setNom(user.nom || '');
        setEmail(user.email || '');
      }, 0);
      return () => clearTimeout(t);
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

  const handleResetDatabase = async () => {
    const ok = await confirm({
      title: 'Remise à zéro de la base de données',
      message: `Êtes-vous absolument sûr ?\n\nCette action supprimera DÉFINITIVEMENT toutes les données de test (colis, expéditions, factures, paiements, clients et devis).\n\nLe compte Administrateur (${user?.email || 'admin@tangaly.com'}) et vos accès seront intégralement conservés.`,
      type: 'danger',
      confirmText: 'Oui, tout remettre à zéro',
      cancelText: 'Annuler',
    });

    if (!ok) return;

    setResetLoading(true);
    try {
      const res = await resetDatabaseAction(keepArticles);
      if (res.success) {
        addToast('success', 'Base de données réinitialisée', res.message);
        setMessage({ text: res.message, type: 'success' });
      } else {
        addToast('error', 'Erreur de réinitialisation', res.message);
        setMessage({ text: res.message, type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur imprévue';
      addToast('error', 'Erreur', msg);
    } finally {
      setResetLoading(false);
    }
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  return (
    <div className={styles.dashboard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Paramètres du Compte</h2>
          <p className={styles.cardSubtitle}>Gérez vos informations personnelles et les options du système.</p>
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

      {isAdmin && (
        <div style={{ marginTop: 32, padding: 24, borderRadius: 12, border: '1px solid #fecaca', background: '#fff1f2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#991b1b', margin: 0 }}>Zone Dangereuse : Remise à zéro de la base de données</h3>
              <p style={{ fontSize: 13, color: '#7f1d1d', margin: '4px 0 0 0' }}>
                Efface toutes les données de test (colis, expéditions, factures, paiements, clients et devis) pour repartir sur une base de données entièrement neuve.
              </p>
            </div>
          </div>

          <div style={{ margin: '16px 0', padding: 12, borderRadius: 8, background: 'white', border: '1px solid #fca5a5' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#334155', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={keepArticles}
                onChange={e => setKeepArticles(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#0f172a' }}
              />
              Conserver le catalogue des Tarifs & Articles (Recommandé)
            </label>
            <p style={{ margin: '4px 0 0 28px', fontSize: 12, color: '#64748b' }}>
              Si cette case est cochée, la liste de vos tarifs et articles configurés reste intacte. Seules les transactions de test sont purgées.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
              * Le compte Super Admin (admin@tangaly.com) ne sera jamais supprimé.
            </span>
            <button
              onClick={handleResetDatabase}
              disabled={resetLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: resetLoading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: 14,
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
                opacity: resetLoading ? 0.7 : 1,
              }}
            >
              {resetLoading ? (
                <>
                  <RefreshCw size={16} className={styles.spin} />
                  Nettoyage en cours...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Remettre la base de données à zéro
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
