"use client";
import styles from '../operations.module.css';
import { BarChart2, TrendingUp, Users } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Rapports & Statistiques</h1>
          <p className={styles.pageSubtitle}>Analysez les performances de votre agence ce mois-ci.</p>
        </div>
      </div>
      
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Chiffre d'affaires (Mois)</p>
            <div className={styles.kpiIcon}><TrendingUp size={18} color="#2563eb"/></div>
          </div>
          <p className={styles.kpiValue}>45,000,000 GNF</p>
          <p className={styles.kpiTrend}>↑ +8% par rapport au mois dernier</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Colis Expédiés</p>
            <div className={styles.kpiIcon}><BarChart2 size={18} color="#16a34a"/></div>
          </div>
          <p className={styles.kpiValue}>128</p>
          <p className={styles.kpiTrend}>↑ +12 colis cette semaine</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Nouveaux Clients</p>
            <div className={styles.kpiIcon}><Users size={18} color="#dc2626"/></div>
          </div>
          <p className={styles.kpiValue}>34</p>
          <p className={styles.kpiTrend}>Stable</p>
        </div>
      </div>

      <div className={styles.card} style={{marginTop: 24, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
         <BarChart2 size={64} color="#cbd5e1" style={{marginBottom: 16}}/>
         <p style={{color: '#64748b', fontSize: 16}}>Le graphique détaillé des revenus et expéditions s'affichera ici à la fin du mois.</p>
      </div>
    </div>
  );
}
