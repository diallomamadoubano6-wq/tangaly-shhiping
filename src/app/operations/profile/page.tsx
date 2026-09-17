import styles from '../operations.module.css';

export default function AgentProfile() {
  return (
    <div className={styles.dashboard}>
      <h2 className={styles.sectionTitle}>Mon Profil</h2>
      <div className="card">
        <p>Paramètres du compte agent.</p>
        <p>En développement.</p>
      </div>
    </div>
  );
}
