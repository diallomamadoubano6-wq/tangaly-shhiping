'use client';

import { Clock, CheckCircle2, Download, CreditCard } from 'lucide-react';
import styles from './invoices.module.css';

const INVOICES = [
  { id: 'inv1', ref: 'FAC-2026-001', shipment: 'TNX-26ABC', montant: 185.00, statut: 'PAID',    date: '03/09/2026', echeance: '10/09/2026' },
  { id: 'inv2', ref: 'FAC-2026-002', shipment: 'TNX-26XYZ', montant: 520.50, statut: 'PENDING', date: '02/09/2026', echeance: '12/09/2026' },
  { id: 'inv3', ref: 'FAC-2026-003', shipment: 'TNX-26DEF', montant: 95.00,  statut: 'PAID',    date: '28/08/2026', echeance: '04/09/2026' },
  { id: 'inv4', ref: 'FAC-2026-004', shipment: 'TNX-26GHI', montant: 340.00, statut: 'PENDING', date: '03/09/2026', echeance: '13/09/2026' },
];

const totalDue  = INVOICES.filter(i => i.statut === 'PENDING').reduce((s, i) => s + i.montant, 0);
const totalPaid = INVOICES.filter(i => i.statut === 'PAID').reduce((s, i) => s + i.montant, 0);

export default function ClientInvoicesPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mes Factures</h1>

      {/* Résumé financier */}
      <div className={styles.summary}>
        <div className={styles.summaryCard} style={{ background: '#fff5f5', borderColor: '#feb2b2' }}>
          <span className={styles.summaryIcon} style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}>
            <Clock size={24} />
          </span>
          <div>
            <p className={styles.summaryLabel}>En attente de paiement</p>
            <p className={styles.summaryValue} style={{ color: 'var(--color-danger)' }}>${totalDue.toFixed(2)}</p>
          </div>
        </div>
        <div className={styles.summaryCard} style={{ background: 'var(--color-green-100)', borderColor: '#9ae6b4' }}>
          <span className={styles.summaryIcon} style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}>
            <CheckCircle2 size={24} />
          </span>
          <div>
            <p className={styles.summaryLabel}>Total payé</p>
            <p className={styles.summaryValue} style={{ color: 'var(--color-success)' }}>${totalPaid.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="table-container">
        <div className="table-scroll">
          <table className="table" aria-label="Mes factures">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Expédition</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td><strong>{inv.ref}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{inv.shipment}</td>
                  <td><strong>${inv.montant.toFixed(2)}</strong></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{inv.date}</td>
                  <td style={{ fontSize: '0.8rem' }}>{inv.echeance}</td>
                  <td>
                    {inv.statut === 'PAID' ? (
                      <span className={styles.badgePaid} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Payé
                      </span>
                    ) : (
                      <span className={styles.badgePending} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> En attente
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" aria-label={`Télécharger ${inv.ref}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={14} /> PDF
                      </button>
                      {inv.statut === 'PENDING' && (
                        <button className="btn btn-primary btn-sm" aria-label={`Payer ${inv.ref}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CreditCard size={14} /> Payer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
