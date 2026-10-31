'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Save, KeyRound, LogOut, ShieldCheck, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { getClientProfile, updateClientProfile, changeClientPassword } from '@/actions/client';
import styles from './profile.module.css';

export default function ClientProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const logout = () => signOut({ callbackUrl: '/login' });

  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
  });

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [mustChangePwd, setMustChangePwd] = useState(false);

  // Charger le profil réel depuis la base de données
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getClientProfile();
        if (res.success && res.data) {
          setForm({
            nom: res.data.nom || '',
            email: res.data.email || '',
            telephone: res.data.telephone || '',
            adresse: res.data.adresse || '',
          });
          setMustChangePwd(Boolean(res.data.mustChangePassword));
        } else if (user) {
          setForm({
            nom: user.nom || '',
            email: user.email || '',
            telephone: user.telephone || '',
            adresse: user.localisation || '',
          });
        }
      } catch (err) {
        console.error('Erreur chargement profil:', err);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const res = await updateClientProfile(form);
      if (res.success) {
        setProfileMsg({ type: 'success', text: res.message || 'Profil mis à jour avec succès.' });
      } else {
        setProfileMsg({ type: 'error', text: res.message || 'Erreur lors de la mise à jour.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Erreur inattendue.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwdSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (pwdForm.next !== pwdForm.confirm) {
      setPwdMsg({ type: 'error', text: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.' });
      return;
    }

    if (pwdForm.next.length < 6) {
      setPwdMsg({ type: 'error', text: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
      return;
    }

    setSavingPwd(true);

    try {
      const res = await changeClientPassword({
        currentPassword: pwdForm.current,
        newPassword: pwdForm.next,
      });

      if (res.success) {
        setPwdMsg({ type: 'success', text: res.message || 'Mot de passe modifié avec succès.' });
        setPwdForm({ current: '', next: '', confirm: '' });
        setMustChangePwd(false);
      } else {
        setPwdMsg({ type: 'error', text: res.message || 'Erreur lors du changement de mot de passe.' });
      }
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Erreur inattendue.' });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mon Profil & Paramètres</h1>

      {mustChangePwd && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '14px 18px',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 10,
          color: '#92400e',
          marginBottom: 24,
          fontSize: '0.92rem',
          lineHeight: 1.5,
        }}>
          <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: 2, color: '#d97706' }} />
          <div>
            <strong>Sécurité du compte :</strong> Vous utilisez actuellement le mot de passe généré par défaut lors de la création de votre expédition. Veuillez le modifier dans la section <em>« Sécurité du compte »</em> ci-dessous pour sécuriser vos futures connexions.
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* Informations personnelles */}
        <section aria-labelledby="info-title">
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>{form.nom?.charAt(0) || user?.nom?.charAt(0) || 'C'}</div>
              <div>
                <h2 id="info-title" className={styles.cardTitle}>{form.nom || user?.nom || 'Client TANGALY'}</h2>
                <span className={styles.roleBadge}>Client TANGALY</span>
              </div>
            </div>

            {profileMsg && (
              <div
                className={profileMsg.type === 'success' ? styles.successMsg : styles.errorBox}
                role="status"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.88rem',
                  background: profileMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${profileMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  color: profileMsg.type === 'success' ? '#166534' : '#b91c1c',
                }}
              >
                {profileMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className={styles.row}>
                <div className="form-group">
                  <label htmlFor="p-nom" className="form-label">Nom complet</label>
                  <input
                    id="p-nom"
                    className="form-input"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    required
                    disabled={profileLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p-email" className="form-label">Email</label>
                  <input
                    id="p-email"
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={profileLoading}
                  />
                </div>
              </div>
              <div className={styles.row}>
                <div className="form-group">
                  <label htmlFor="p-tel" className="form-label">Numéro de Téléphone (Identifiant)</label>
                  <input
                    id="p-tel"
                    type="tel"
                    className="form-input"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    placeholder="ex: +224 622 00 00 00"
                    disabled={profileLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p-adr" className="form-label">Adresse de livraison</label>
                  <input
                    id="p-adr"
                    className="form-input"
                    value={form.adresse}
                    onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                    placeholder="Ville, Quartier"
                    disabled={profileLoading}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                disabled={savingProfile || profileLoading}
              >
                <Save size={16} />
                {savingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </section>

        {/* Sécurité */}
        <section aria-labelledby="security-title">
          <div className={styles.card}>
            <h2 id="security-title" className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} className="text-primary" /> Sécurité du compte
            </h2>

            {pwdMsg && (
              <div
                className={pwdMsg.type === 'success' ? styles.successMsg : styles.errorBox}
                role="status"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.88rem',
                  background: pwdMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${pwdMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                  color: pwdMsg.type === 'success' ? '#166534' : '#b91c1c',
                }}
              >
                {pwdMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePwdSave}>
              <div className="form-group">
                <label htmlFor="p-cur" className="form-label">Mot de passe actuel</label>
                <input
                  id="p-cur"
                  type="password"
                  className="form-input"
                  placeholder="Votre mot de passe actuel ou mot de passe par défaut"
                  value={pwdForm.current}
                  onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="p-new" className="form-label">Nouveau mot de passe</label>
                <input
                  id="p-new"
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 caractères"
                  value={pwdForm.next}
                  onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="p-conf" className="form-label">Confirmer le nouveau mot de passe</label>
                <input
                  id="p-conf"
                  type="password"
                  className="form-input"
                  placeholder="Répétez le nouveau mot de passe"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                disabled={savingPwd}
              >
                <KeyRound size={16} />
                {savingPwd ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </form>

            <hr className="divider" style={{ margin: '24px 0' }} />

            <div className={styles.dangerZone}>
              <h3 className={styles.dangerTitle}>Déconnexion</h3>
              <p className={styles.dangerDesc}>La déconnexion mettra fin à votre session sur cet appareil.</p>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={logout}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={15} /> Se déconnecter
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
