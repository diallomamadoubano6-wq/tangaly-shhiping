'use client';

import { useState, useTransition } from 'react';
import Badge from '@/components/ui/Badge';
import {
  SHIPMENT_STATUSES,
  STATUS_ORDER,
  getStatusInfo,
  getStatusIndex,
  type ShipmentStatusCode,
} from '@/lib/trackingStatuses';
import { publicTracking } from '@/actions/public';
import styles from './tracking.module.css';

// Appel vers la Server Action
async function fetchFromAPI(numero: string) {
  if (!numero || numero.length < 4) return null;
  const res = await publicTracking(numero.toUpperCase());
  if (res.success && res.data) {
    return res.data;
  }
  return null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusStepper({ currentStatut }: { currentStatut: string }) {
  const currentIdx = getStatusIndex(currentStatut);
  return (
    <div className={styles.stepper} role="list" aria-label="Progression de l'expédition">
      {SHIPMENT_STATUSES.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div
            key={s.code}
            className={`${styles.step} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}
            role="listitem"
            aria-current={active ? 'step' : undefined}
          >
            <div
              className={styles.stepBubble}
              style={done ? { background: s.color, borderColor: s.color } : {}}
              aria-hidden="true"
            >
              {done ? s.icon : <span className={styles.stepNum}>{i + 1}</span>}
            </div>
            {i < SHIPMENT_STATUSES.length - 1 && (
              <div className={`${styles.stepLine} ${done && i < currentIdx ? styles.stepLineDone : ''}`} aria-hidden="true" />
            )}
            <span className={styles.stepLabel}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function TrackingTimeline({ events }: { events: any[] }) {
  return (
    <div className={styles.timeline} role="list" aria-label="Historique des événements">
      {events.map((ev, i) => {
        const info = getStatusInfo(ev.statut);
        const isLatest = i === events.length - 1;
        return (
          <div key={ev.id} className={`${styles.event} ${isLatest ? styles.eventLatest : ''}`} role="listitem">
            <div className={styles.eventLeft}>
              <div
                className={styles.eventDot}
                style={{ background: isLatest ? info.color : '#e2e8f0', borderColor: isLatest ? info.color : '#e2e8f0' }}
                aria-hidden="true"
              >
                {isLatest && <span>{info.icon}</span>}
              </div>
              {i < events.length - 1 && <div className={styles.eventLine} />}
            </div>
            <div className={styles.eventBody}>
              <div className={styles.eventHeader}>
                <span
                  className={styles.eventStatut}
                  style={isLatest ? { color: info.color } : {}}
                >
                  {info.labelFr}
                </span>
                <time className={styles.eventDate} dateTime={ev.date}>{formatDate(ev.date)}</time>
              </div>
              {ev.commentaire && <p className={styles.eventComment}>{ev.commentaire}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrackingPage() {
  const [numero, setNumero] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim()) return;
    setError('');
    setResult(null);
    startTransition(async () => {
      const data = await fetchFromAPI(numero.trim());
      if (!data) {
        setError(`Aucun colis trouvé pour le numéro "${numero.trim()}". Vérifiez votre numéro ou contactez-nous.`);
      } else {
        setResult(data);
      }
    });
  };

  const statusInfo = result ? getStatusInfo(result.statut) : null;

  return (
    <section className={styles.page}>
      <div className="container">

        {/* En-tête */}
        <div className={styles.pageHeader}>
          <h1>Suivi de colis en temps réel</h1>
          <p>Entrez votre numéro de tracking TANGALY pour localiser votre expédition.</p>
        </div>

        {/* Formulaire de recherche */}
        <form
          className={styles.searchForm}
          onSubmit={handleSearch}
          role="search"
          aria-label="Rechercher un colis"
        >
          <label htmlFor="tracking-input" className="sr-only">Numéro de tracking</label>
          <input
            id="tracking-input"
            type="text"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className={`form-input ${styles.searchInput}`}
            placeholder="Ex: TNX-26ABC"
            aria-label="Numéro de tracking"
            autoComplete="off"
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isPending || !numero.trim()}
            aria-busy={isPending}
          >
            {isPending ? <span className="spinner" aria-hidden="true" /> : '🔍'}
            {isPending ? 'Recherche...' : 'Suivre'}
          </button>
        </form>

        {/* Message d'erreur */}
        {error && (
          <div className={styles.errorBox} role="alert">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Résultat */}
        {result && statusInfo && (
          <div className={styles.resultWrap} aria-live="polite">

            {/* Carte principale */}
            <div className={styles.resultCard}>
              <div className={styles.resultHeader}>
                <div>
                  <p className={styles.resultLabel}>Numéro de tracking</p>
                  <h2 className={styles.resultTrackingNum}>{result.tracking_number}</h2>
                </div>
                <div className={styles.resultStatusBadge} style={{ color: statusInfo.color, background: statusInfo.bgColor }}>
                  <span className={styles.resultStatusIcon}>{statusInfo.icon}</span>
                  <span>{statusInfo.label}</span>
                </div>
              </div>

              {/* Métadonnées */}
              <div className={styles.meta}>
                <div className={styles.metaRoute}>
                  <div className={styles.metaCity}>
                    <span className={styles.metaCityLabel}>Origine</span>
                    <span className={styles.metaCityVal}>{result.origine}</span>
                  </div>
                  <div className={styles.metaRouteLine} aria-hidden="true">
                    <span className={styles.metaPlane}>✈</span>
                  </div>
                  <div className={styles.metaCity}>
                    <span className={styles.metaCityLabel}>Destination</span>
                    <span className={styles.metaCityVal}>{result.destination}</span>
                  </div>
                </div>
                <div className={styles.metaDetails}>
                  <div className={styles.metaItem}><span>Transport</span><strong>{result.type_transport}</strong></div>
                  {result.poids && <div className={styles.metaItem}><span>Poids</span><strong>{result.poids} kg</strong></div>}
                  <div className={styles.metaItem}><span>Dernière mise à jour</span><strong>{formatDate(result.updatedAt)}</strong></div>
                </div>
              </div>

              {/* Stepper de progression */}
              <div className={styles.stepperWrap}>
                <h3 className={styles.sectionSubtitle}>Progression</h3>
                <StatusStepper currentStatut={result.statut} />
              </div>
            </div>

            {/* Timeline des événements */}
            <div className={styles.timelineCard}>
              <h3 className={styles.timelineTitle}>Historique détaillé</h3>
              <TrackingTimeline events={[...result.tracking_events].reverse()} />
            </div>

          </div>
        )}

        {/* Aide */}
        {!result && !error && (
          <div className={styles.helpSection}>
            <h3>Comment trouver mon numéro de tracking ?</h3>
            <ul className={styles.helpList}>
              <li>📧 Il vous a été envoyé par email lors de la création de votre expédition.</li>
              <li>👤 Il est disponible dans votre espace client, rubrique "Mes expéditions".</li>
              <li>📱 Notre équipe peut vous le communiquer par WhatsApp au +1 (555) 000-0000.</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
