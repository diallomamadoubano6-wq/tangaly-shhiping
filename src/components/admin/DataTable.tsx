'use client';

import React, { useState } from 'react';
import styles from './DataTable.module.css';

interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

export default function DataTable({ title, columns, data, onEdit, onDelete }: DataTableProps) {
  const [search, setSearch] = useState('');

  const filteredData = data.filter((item) =>
    columns.some((col) => 
      String(item[col.key]).toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>{title}</h2>
        <div className={styles.tableActions}>
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.addButton}>+ Ajouter</button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
              <th className={styles.actionCol}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr key={row.id || index}>
                  {columns.map((col) => (
                    <td key={col.key}>{row[col.key]}</td>
                  ))}
                  <td className={styles.actionCells}>
                    {onEdit && <button onClick={() => onEdit(row)} className={styles.editBtn}>Éditer</button>}
                    {onDelete && <button onClick={() => onDelete(row)} className={styles.deleteBtn}>Supprimer</button>}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className={styles.noData}>
                  Aucun résultat trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
