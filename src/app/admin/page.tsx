import styles from './admin.module.css';
import { Package, Truck, CheckCircle, Trophy, Wallet, Search, MapPin, Building2, BarChart2, FileText, Phone, Mail, Target, DollarSign, Clock, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { getAdminDashboardStats } from '@/actions/admin';
import { getStatusInfo } from '@/lib/trackingStatuses';

export default async function AdminDashboard() {
  const { stats, recentShipments } = await getAdminDashboardStats();

  return (
    <>
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Total Expéditions</p>
            <div className={styles.kpiIcon}><Package size={18} color="#94a3b8"/></div>
          </div>
          <p className={styles.kpiValue}>{stats?.totalExpeditions || 0}</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>En attente de réception</p>
            <div className={styles.kpiIcon}><Trophy size={18} color="#f59e0b"/></div>
          </div>
          <p className={styles.kpiValue}>{stats?.enAttente || 0}</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>En Transit</p>
            <div className={styles.kpiIcon}><Truck size={18} color="#6366f1"/></div>
          </div>
          <p className={styles.kpiValue}>{stats?.enTransit || 0}</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Livrés</p>
            <div className={styles.kpiIcon}><CheckCircle size={18} color="#10b981"/></div>
          </div>
          <p className={styles.kpiValue}>{stats?.livres || 0}</p>
        </div>
        
        <div className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <p className={styles.kpiTitle}>Montant Collecté</p>
            <div className={styles.kpiIcon}><Wallet size={18} color="#ef4444"/></div>
          </div>
          <p className={styles.kpiValue}>{(stats?.montantCollecte || 0).toLocaleString()} GNF</p>
        </div>
      </div>

      <div className={styles.middleRow}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Expéditions (ce mois)</h2>
              <p className={styles.cardSubtitle}>Courbe de tendance journalière</p>
            </div>
            <select 
              style={{
                fontSize: 12, padding: '6px 10px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: 'white',
                color: '#475569', cursor: 'pointer', outline: 'none',
                fontWeight: 500
              }}
            >
              <option>Ce mois</option>
              <option>3 derniers mois</option>
              <option>Cette année</option>
            </select>
          </div>
          <div style={{height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position:'relative'}}>
             {/* Simulation de graphique */}
             <div style={{position:'absolute', width:'100%', height:'100%', borderBottom:'1px solid #e2e8f0', borderLeft:'1px solid #e2e8f0'}}>
                <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                  <path d="M0,180 L100,180 L200,180 L250,180 L350,50 L450,180 L500,180" fill="none" stroke="#3b82f6" strokeWidth="3" />
                  <path d="M0,180 L100,180 L200,180 L250,180 L350,50 L450,180 L500,180 L500,200 L0,200 Z" fill="rgba(59, 130, 246, 0.1)" />
                  <circle cx="350" cy="50" r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                </svg>
             </div>
          </div>
        </div>
        
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Répartition par statut</h2>
              <p className={styles.cardSubtitle}>Pourcentages par étape</p>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
            <div style={{width: 140, height: 140, borderRadius: '50%', background: 'conic-gradient(#10b981 0% 30%, #3b82f6 30% 40%, #0ea5e9 40% 40%, #f59e0b 40% 100%)', display:'flex', alignItems:'center', justifyContent:'center'}}>
               <div style={{width: 100, height: 100, borderRadius: '50%', background: 'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                  <span style={{fontSize: 24, fontWeight: 'bold'}}>10</span>
                  <span style={{fontSize: 10, color: '#64748b'}}>Total colis</span>
               </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%', marginTop:24, fontSize:12, color:'#475569'}}>
               <div style={{display:'flex', justifyContent:'space-between'}}><span><span style={{color:'#f59e0b'}}>●</span> Enregistré</span> <b>5</b></div>
               <div style={{display:'flex', justifyContent:'space-between'}}><span><span style={{color:'#1e293b'}}>●</span> En préparation</span> <b>1</b></div>
               <div style={{display:'flex', justifyContent:'space-between'}}><span><span style={{color:'#8b5cf6'}}>●</span> Expédié</span> <b>0</b></div>
               <div style={{display:'flex', justifyContent:'space-between'}}><span><span style={{color:'#f97316'}}>●</span> En transit</span> <b>1</b></div>
               <div style={{display:'flex', justifyContent:'space-between'}}><span><span style={{color:'#0ea5e9'}}>●</span> Arrivé à destination</span> <b>0</b></div>
               <div style={{display:'flex', justifyContent:'space-between'}}><span><span style={{color:'#10b981'}}>●</span> Livré</span> <b>3</b></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.bottomGrid}>
        <div className={styles.rightCol}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Dernières expéditions</h2>
              <span style={{color:'#2563eb', fontSize:12, fontWeight:500, cursor:'pointer'}}>Voir toutes les expéditions</span>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Expédition</th>
                  <th>Expéditeur</th>
                  <th>Destinataire</th>
                  <th>Destination</th>
                  <th>Poids</th>
                  <th>Statut</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments?.map((shipment) => {
                  const statusInfo = getStatusInfo(shipment.statut);
                  return (
                    <tr key={shipment.id}>
                      <td style={{fontWeight:500}}>{shipment.tracking_number}</td>
                      <td>{shipment.expediteur}</td>
                      <td>{shipment.destinataire}</td>
                      <td>{shipment.destination}</td>
                      <td>{shipment.poids}</td>
                      <td>
                        <span className={styles.statusBadge} style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td style={{fontWeight:600}}>{shipment.montant.toLocaleString()} GNF</td>
                    </tr>
                  );
                })}
                {(!recentShipments || recentShipments.length === 0) && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                      Aucune expédition récente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className={styles.rightCol}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Actions rapides</h2>
            </div>
            <div className={styles.actionsGrid}>
               <Link href="/admin/shipments" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><Package size={24} color="#8b5cf6"/></div>
                  Nouvelle<br/>expédition
               </Link>
               <Link href="/admin/shipments" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><MapPin size={24} color="#ec4899"/></div>
                  Enregistrer<br/>reçu
               </Link>
               <Link href="/admin/shipments" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><Search size={24} color="#0ea5e9"/></div>
                  Rechercher
               </Link>
               <Link href="/admin/tarifs" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><Wallet size={24} color="#f59e0b"/></div>
                  Paiements
               </Link>
               <Link href="/admin/quotes" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><FileText size={24} color="#64748b"/></div>
                  Factures
               </Link>
               <Link href="/admin" className={styles.actionItem} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.actionIcon}><BarChart2 size={24} color="#10b981"/></div>
                  Rapports
               </Link>
            </div>
          </div>
          
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Maintenance / A faire</h2>
            </div>
            <div className={styles.taskList}>
               <div className={styles.taskItem}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <Package size={16} color="#2563eb" />
                    <span>Colis à recevoir aujourd'hui</span>
                  </div>
                  <span className={`${styles.taskBadge} ${styles.blue}`}>8</span>
               </div>
               <div className={styles.taskItem}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <CreditCard size={16} color="#d97706" />
                    <span>Paiements en attente</span>
                  </div>
                  <span className={`${styles.taskBadge} ${styles.yellow}`}>12</span>
               </div>
               <div className={styles.taskItem}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <FileText size={16} color="#9333ea" />
                    <span>Factures à envoyer</span>
                  </div>
                  <span className={`${styles.taskBadge} ${styles.purple}`}>7</span>
               </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.bottomRow}>
         <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Collecte financière (ce mois)</h2>
                <p className={styles.cardSubtitle}>Objectif vs Réalisé</p>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:24}}>
               <div style={{width: 90, height: 90, borderRadius: '50%', background: 'conic-gradient(#2563eb 0% 76%, #e2e8f0 76% 100%)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <div style={{width: 70, height: 70, borderRadius: '50%', background: 'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>
                     76%
                  </div>
               </div>
               <div style={{fontSize: 13, lineHeight: '24px'}}>
                  <div style={{color:'#64748b', display: 'flex', alignItems: 'center', gap: 6}}>
                    <Target size={15} />
                    <span>Objectif : <b>5,000,000 GNF</b></span>
                  </div>
                  <div style={{color:'#10b981', display: 'flex', alignItems: 'center', gap: 6}}>
                    <DollarSign size={15} />
                    <span>Collecté : <b>3,862,500 GNF</b></span>
                  </div>
                  <div style={{color:'#f59e0b', display: 'flex', alignItems: 'center', gap: 6}}>
                    <Clock size={15} />
                    <span>Reste : <b>1,137,500 GNF</b></span>
                  </div>
               </div>
            </div>
         </div>
         
         <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>TANGALY Siège</h2>
            </div>
            <div className={styles.infoList}>
               <div className={styles.infoItem}>
                  <Building2 size={16}/>
                  <span className={styles.infoLabel}>Organisation :</span>
                  <span className={styles.infoValue}>Tangaly Shipping & Logistics</span>
               </div>
               <div className={styles.infoItem}>
                  <Phone size={16}/>
                  <span className={styles.infoLabel}>Téléphone :</span>
                  <span className={styles.infoValue}>+1 234 567 890</span>
               </div>
               <div className={styles.infoItem}>
                  <Mail size={16}/>
                  <span className={styles.infoLabel}>Email :</span>
                  <span className={styles.infoValue}>contact@tangalylogistics.com</span>
               </div>
               <div className={styles.infoItem}>
                  <MapPin size={16}/>
                  <span className={styles.infoLabel}>Siège :</span>
                  <span className={styles.infoValue}>New York, USA</span>
               </div>
            </div>
         </div>
         
         <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Performance (ce mois)</h2>
                <p className={styles.cardSubtitle}>Indicateurs clés</p>
              </div>
            </div>
            <div>
               <div className={styles.perfItem}>
                  <div className={styles.perfHeader}>
                     <span>Taux de livraison à temps</span>
                     <span style={{fontWeight:'bold'}}>96%</span>
                  </div>
                  <div className={styles.perfBar}><div className={styles.perfFill} style={{width:'96%'}}></div></div>
               </div>
               <div className={styles.perfItem}>
                  <div className={styles.perfHeader}>
                     <span>Satisfaction client</span>
                     <span style={{fontWeight:'bold'}}>4.8 / 5</span>
                  </div>
                  <div className={styles.perfBar}><div className={`${styles.perfFill} ${styles.blue}`} style={{width:'90%'}}></div></div>
               </div>
            </div>
         </div>
      </div>
    </>
  );
}
