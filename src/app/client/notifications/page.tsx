'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './notifications.module.css';

const MOCK_NOTIFS = [
  { id: '1', date: '03/09/2026 22:00', type: 'CHANGEMENT_STATUT', message: 'Votre colis TNX-26ABC est en transit vers Conakry.', lu: false, canal: 'EMAIL' },
  { id: '2', date: '03/09/2026 10:15', type: 'NOUVEAU_COLIS',     message: 'Votre expédition TNX-26ABC a été créée.', lu: true, canal: 'EMAIL' },
  { id: '3', date: '28/08/2026 14:30', type: 'LIVRAISON',         message: 'Votre colis TNX-26DEF a été livré avec succès.', lu: true, canal: 'WHATSAPP' },
];

export default function NotificationsPage() {  const { data: session } = useSession();
  const user = session?.user as any;

  const [prefs, setPrefs] = useState({ email: true, sms: false, push: true });
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const [saved, setSaved] = useState(false);

  const handleSavePrefs = (e: React.FormEvent) => {
    e.preventDefault();
    // POST /api/client/notifications/preferences
    setTimeout(() => setSaved(true), 500);
    setTimeout(() => setSaved(false), 3000);
  };

  const markAsRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notifications</h1>

      <div className={styles.grid}>
        {/* Historique */}
        <section className={styles.historySection} aria-labelledby="historique-title">
          <div className={styles.card}>
            <h2 id="historique-title" className={styles.sectionTitle}>Dernières alertes</h2>
            
            <ul className={styles.notifList}>
              {notifs.map((n) => (
                <li key={n.id} className={`${styles.notifItem} ${n.lu ? styles.notifRead : ''}`} onClick={() => markAsRead(n.id)}>
                  <div className={styles.notifIcon}>
                    {n.type === 'CHANGEMENT_STATUT' ? '🔄' : n.type === 'NOUVEAU_COLIS' ? '📦' : '🎉'}
                  </div>
                  <div className={styles.notifBody}>
                    <p className={styles.notifMessage}>{n.message}</p>
                    <div className={styles.notifMeta}>
                      <span>{n.date}</span>
                      <span className={styles.canalBadge}>{n.canal}</span>
                    </div>
                  </div>
                  {!n.lu && <div className={styles.unreadDot} />}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Préférences */}
        <section aria-labelledby="prefs-title">
          <div className={styles.card}>
            <h2 id="prefs-title" className={styles.sectionTitle}>Préférences</h2>
            <p className={styles.prefsDesc}>Choisissez comment vous souhaitez être informé de l'avancée de vos colis.</p>
            
            {saved && <div className={styles.successMsg}>✅ Préférences enregistrées.</div>}

            <form onSubmit={handleSavePrefs} className={styles.prefsForm}>
              <label className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>Emails ✉️</span>
                  <p className={styles.toggleSub}>Recevoir les mises à jour par email</p>
                </div>
                <input type="checkbox" checked={prefs.email} onChange={(e) => setPrefs({...prefs, email: e.target.checked})} className={styles.toggleInput} />
              </label>

              <label className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>WhatsApp / SMS 📱</span>
                  <p className={styles.toggleSub}>Alertes instantanées sur votre téléphone</p>
                </div>
                <input type="checkbox" checked={prefs.sms} onChange={(e) => setPrefs({...prefs, sms: e.target.checked})} className={styles.toggleInput} />
              </label>

              <label className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>Notifications navigateur 🔔</span>
                  <p className={styles.toggleSub}>Alertes lorsque vous êtes sur l'espace client</p>
                </div>
                <input type="checkbox" checked={prefs.push} onChange={(e) => setPrefs({...prefs, push: e.target.checked})} className={styles.toggleInput} />
              </label>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Enregistrer</button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
