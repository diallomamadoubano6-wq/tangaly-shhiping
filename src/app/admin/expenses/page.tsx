'use client';
import { useState } from 'react';
import styles from '../operations.module.css';
import { PlusSquare, Search, Filter, Trash2 } from 'lucide-react';

export default function ExpensesPage() {
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState([
    { id: "EXP-001", description: "Carburant camionnette", amount: "$50", date: "06 Sep 2026", user: "Adama Diallo", category: "Transport" },
    { id: "EXP-002", description: "Fournitures bureau", amount: "$15", date: "05 Sep 2026", user: "Adama Diallo", category: "Fournitures" }
  ]);
  
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Transport');

  const handleAdd = () => {
    if(!newDesc || !newAmount) return;
    setExpenses([
      { 
        id: `EXP-00${expenses.length + 1}`, 
        description: newDesc, 
        amount: `$${newAmount}`, 
        date: new Date().toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'}), 
        user: "Adama Diallo",
        category: newCategory
      },
      ...expenses
    ]);
    setShowModal(false);
    setNewDesc('');
    setNewAmount('');
    setNewCategory('Transport');
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Dépenses de l'Agence</h1>
          <p className={styles.pageSubtitle}>Suivi des frais de fonctionnement et dépenses locales.</p>
        </div>
        <button onClick={() => setShowModal(true)} className={styles.primaryButton}>
          <PlusSquare size={18} /> Ajouter une dépense
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Rechercher une dépense..." className={styles.searchInput} />
          </div>
          <button className={styles.secondaryButton}>
            <Filter size={18} /> Filtrer
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Enregistré par</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={i}>
                  <td><strong>{e.id}</strong></td>
                  <td>{e.description}</td>
                  <td><span className={`${styles.badge} ${styles.badgeInfo}`}>{e.category}</span></td>
                  <td style={{fontWeight: 700, color: '#ef4444'}}>{e.amount}</td>
                  <td>{e.date}</td>
                  <td>{e.user}</td>
                  <td>
                    <button className={styles.textButton}><Trash2 size={14}/> Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Ajouter une dépense</h2>
              <button className={styles.closeButton} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <input 
                  type="text" 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Achat de scotch"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Catégorie</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={styles.input}
                >
                  <option>Transport</option>
                  <option>Fournitures</option>
                  <option>Communication</option>
                  <option>Repas</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Montant (USD)</label>
                <input 
                  type="number" 
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Ex: 25"
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={() => setShowModal(false)}>Annuler</button>
              <button className={styles.primaryButton} onClick={handleAdd}>
                <PlusSquare size={16} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
