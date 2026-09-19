'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Save, KeyRound, LogOut, ShieldCheck, CheckCircle2 } from 'lucide-react';
import styles from './profile.module.css';

export default function ClientProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const logout = () => signOut();

  const [form, setForm] = useState({
    nom: user?.nom ?? '',
    email: user?.email ?? '',
    telephone: '+224 620 00 00 00',
    adresse: 'Conakry, Guinée',
  });

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [saved, setSaved]     = useState(false);
  const [pwdSaved, setPwdSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // POST /api/client/profile
    setTimeout(() => setSaved(true), 500);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePwdSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) return alert('Les mots de passe ne correspondent pas.');
    // POST /api/auth/change-password
    setTimeout(() => setPwdSaved(true), 500);
    setTimeout(() => setPwdSaved(false), 3000);
    setPwdForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mon Profil</h1>

      <div className={styles.grid}>
        {/* Informations personnelles */}
        <section aria-labelledby="info-title">
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>{user?.nom?.charAt(0) ?? 'C'}</div>
              <div>
                <h2 id="info-title" className={styles.cardTitle}>{user?.nom}</h2>
                <span className={styles.roleBadge}>Client TANGALY</span>
              </div>
            </div>

            {saved && (
              <div className={styles.successMsg} role="status" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Profil mis à jour avec succès.
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className={styles.row}>
                <div className="form-group">
                  <label htmlFor="p-nom" className="form-label">Nom complet</label>
                  <input id="p-nom" className="form-input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="p-email" className="form-label">Email</label>
                  <input id="p-email" type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className={styles.row}>
                <div className="form-group">
                  <label htmlFor="p-tel" className="form-label">Téléphone</label>
                  <input id="p-tel" type="tel" className="form-input" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="p-adr" className="form-label">Adresse</label>
                  <input id="p-adr" className="form-input" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Save size={16} /> Enregistrer les modifications
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

            {pwdSaved && (
              <div className={styles.successMsg} role="status" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Mot de passe mis à jour.
              </div>
            )}

            <form onSubmit={handlePwdSave}>
              <div className="form-group">
                <label htmlFor="p-cur" className="form-label">Mot de passe actuel</label>
                <input id="p-cur" type="password" className="form-input" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="p-new" className="form-label">Nouveau mot de passe</label>
                <input id="p-new" type="password" className="form-input" placeholder="Minimum 8 caractères" value={pwdForm.next} onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })} required minLength={8} />
              </div>
              <div className="form-group">
                <label htmlFor="p-conf" className="form-label">Confirmer le nouveau mot de passe</label>
                <input id="p-conf" type="password" className="form-input" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={16} /> Changer le mot de passe
              </button>
            </form>

            <hr className="divider" />

            <div className={styles.dangerZone}>
              <h3 className={styles.dangerTitle}>Zone de danger</h3>
              <p className={styles.dangerDesc}>La déconnexion mettra fin à votre session sur cet appareil.</p>
              <button className="btn btn-danger btn-sm" onClick={logout} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <LogOut size={15} /> Se déconnecter
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
