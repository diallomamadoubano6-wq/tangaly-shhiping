'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getStatusInfo } from '@/lib/trackingStatuses';
import styles from './dashboard.module.css';

// Mock data client — à connecter à GET /api/client/dashboard ou via Server Actions plus tard
const MOCK_DATA = {
  stats: [
    { label: 'Expéditions actives', value: '3',  icon: '📦', color: '#e8f0fe', link: '/client/shipments' },
    { label: 'En transit',          value: '1',  icon: '✈️', color: '#ebf8ff', link: '/client/shipments?statut=SHIPPED' },
    { label: 'Devis en attente',    value: '2',  icon: '📋', color: '#fffff0', link: '/client/quotes' },
    { label: 'Documents disponibles', value: '5', icon: '📄', color: '#f0fff4', link: '/client/documents' },
  ],
  recentShipments: [
    { id: 's1', tracking_number: 'TNX-26ABC', origine: 'New York', destination: 'Conakry', statut: 'SHIPPED',   date: '03/09/2026' },
    { id: 's2', tracking_number: 'TNX-26XYZ', origine: 'Miami',    destination: 'Conakry', statut: 'RECEIVED',  date: '02/09/2026' },
    { id: 's3', tracking_number: 'TNX-26DEF', origine: 'New York', destination: 'Conakry', statut: 'DELIVERED', date: '28/08/2026' },
  ],
  recentQuotes: [
    { id: 'q1', ref: 'Q-441', service: 'Fret Aérien',  statut: 'PENDING',  date: '03/09/2026' },
    { id: 'q2', ref: 'Q-438', service: 'Fret Maritime', statut: 'DELIVERED', date: '25/08/2026' },
  ],
};

export default function ClientDashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const data = MOCK_DATA;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className={styles.page}>
      {/* En-tête de bienvenue */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.welcomeTitle}>{greeting}, {user?.name?.split(' ')[0] || 'Client'} 👋</h1>
          <p className={styles.welcomeSub}>Voici un résumé de votre activité TANGALY.</p>
        </div>
        <Link href="/client/shipments" className="btn btn-primary">
          + Nouvelle expédition
        </Link>
      </div>

      {/* KPI Cards */}
      <ul className={styles.kpiGrid} role="list" aria-label="Indicateurs clés">
        {data.stats.map((s) => (
          <li key={s.label}>
            <Link href={s.link} className={styles.kpiCard} style={{ background: s.color }}>
              <span className={styles.kpiIcon} aria-hidden="true">{s.icon}</span>
              <div>
                <p className={styles.kpiValue}>{s.value}</p>
                <p className={styles.kpiLabel}>{s.label}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Grille principale */}
      <div className={styles.mainGrid}>

        {/* Expéditions récentes */}
        <section aria-labelledby="recent-shipments">
          <div className={styles.sectionHeader}>
            <h2 id="recent-shipments" className={styles.sectionTitle}>Expéditions récentes</h2>
            <Link href="/client/shipments" className="btn btn-ghost btn-sm">Voir tout →</Link>
          </div>
          <div className="table-container">
            <div className="table-scroll">
              <table className="table" aria-label="Expéditions récentes">
                <thead>
                  <tr>
                    <th>Tracking</th>
                    <th>Trajet</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentShipments.map((s) => {
                    const info = getStatusInfo(s.statut);
                    return (
                      <tr key={s.id}>
                        <td><strong style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.tracking_number}</strong></td>
                        <td style={{ fontSize: '0.8rem' }}>{s.origine} → {s.destination}</td>
                        <td>
                          <span style={{ color: info.color, background: info.bgColor, padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {info.icon} {info.label}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.date}</td>
                        <td>
                          <Link href={`/tracking?numero=${s.tracking_number}`} className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>Suivre</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Colonne droite */}
        <div className={styles.rightCol}>
          {/* Devis récents */}
          <section aria-labelledby="recent-quotes">
            <div className={styles.sectionHeader}>
              <h2 id="recent-quotes" className={styles.sectionTitle}>Mes devis</h2>
              <Link href="/client/quotes" className="btn btn-ghost btn-sm">Voir tout →</Link>
            </div>
            <div className={styles.quoteList}>
              {data.recentQuotes.map((q) => (
                <div key={q.id} className={styles.quoteCard}>
                  <div>
                    <p className={styles.quoteRef}>{q.ref}</p>
                    <p className={styles.quoteService}>{q.service}</p>
                  </div>
                  <div className={styles.quoteRight}>
                    <span className={`${styles.quoteBadge} ${q.statut === 'PENDING' ? styles.quotePending : styles.quoteDelivered}`}>
                      {q.statut === 'PENDING' ? '⏳ En attente' : '✅ Traité'}
                    </span>
                    <span className={styles.quoteDate}>{q.date}</span>
                  </div>
                </div>
              ))}
              <Link href="/devis" className={`btn btn-outline ${styles.newQuoteBtn}`}>
                + Demander un devis
              </Link>
            </div>
          </section>

          {/* Liens rapides */}
          <section aria-labelledby="quick-links">
            <h2 id="quick-links" className={styles.sectionTitle}>Accès rapides</h2>
            <ul className={styles.quickLinks} role="list">
              {[
                { href: '/tracking',          icon: '🔍', label: 'Suivre un colis' },
                { href: '/client/documents',  icon: '📄', label: 'Mes documents' },
                { href: '/client/invoices',   icon: '💰', label: 'Mes factures' },
                { href: '/contact',           icon: '💬', label: 'Contacter le support' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={styles.quickLink}>
                    <span>{l.icon}</span> {l.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
