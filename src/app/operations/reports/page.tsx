"use client";
import { useState, useEffect } from 'react';
import styles from '../operations.module.css';
import { BarChart2, TrendingUp, Users } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { getReportsStats } from '@/actions/admin';

export default function ReportsPage() {
  const { formatFromGNF } = useCurrency();
  const [stats, setStats] = useState({ revenue: 0, totalShipments: 0, totalClients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getReportsStats();
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Erreur chargement statistiques:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Rapports &amp; Statistiques</h1>
          <p className={styles.pageSubtitle}>Analysez les performances de votre agence en temps réel.</p>
        </div>
      </div>
      
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Chiffre d&apos;affaires (Encaissé)</p>
            <div className={styles.kpiIcon}><TrendingUp size={18} color="#2563eb"/></div>
          </div>
          <p className={styles.kpiValue}>
            {loading ? 'Calcul...' : formatFromGNF(stats.revenue)}
          </p>
          <p className={styles.kpiTrend}>Paiements enregistrés</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Colis Expédiés</p>
            <div className={styles.kpiIcon}><BarChart2 size={18} color="#16a34a"/></div>
          </div>
          <p className={styles.kpiValue}>
            {loading ? '...' : stats.totalShipments}
          </p>
          <p className={styles.kpiTrend}>Expéditions enregistrées</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Clients Enregistrés</p>
            <div className={styles.kpiIcon}><Users size={18} color="#dc2626"/></div>
          </div>
          <p className={styles.kpiValue}>
            {loading ? '...' : stats.totalClients}
          </p>
          <p className={styles.kpiTrend}>Clients dans l&apos;annuaire</p>
        </div>
      </div>

      <div className={styles.card} style={{marginTop: 24, minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px'}}>
         <BarChart2 size={64} color="#cbd5e1" style={{marginBottom: 16}}/>
         <p style={{color: '#334155', fontSize: 16, fontWeight: 500, margin: 0}}>
           {stats.totalShipments === 0 ? 'Aucune donnée d’activité pour le moment' : `${stats.totalShipments} expéditions enregistrées`}
         </p>
         <p style={{color: '#94a3b8', fontSize: 14, margin: '8px 0 0'}}>
           {stats.totalShipments === 0 
             ? 'La base de données est réinitialisée. Les graphiques détaillés se construiront automatiquement dès vos premières expéditions.'
             : 'Les graphiques d’évolution se consolident au fil des opérations.'}
         </p>
      </div>
    </div>
  );
}
