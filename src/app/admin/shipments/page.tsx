'use client';

import { useState, useEffect } from 'react';
import { SHIPMENT_STATUSES, STATUS_ORDER, getStatusInfo } from '@/lib/trackingStatuses';
import Badge, { statusToVariant } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { getShipments, createShipment, updateShipmentStatus, addShipmentEvent } from '@/actions/shipments';
import { getUsers } from '@/actions/users';
import styles from './admin-tracking.module.css';
import { QRCodeCanvas } from 'qrcode.react';
import { Edit3, MapPin, QrCode, Plus } from 'lucide-react';

const TRANSPORT_TYPES = ['Fret Aérien', 'Fret Maritime'];

export default function AdminTrackingPage() {
  const { addToast } = useToast();

  const [shipments, setShipments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Modales
  const [createModal, setCreateModal] = useState(false);
  const [statusModal, setStatusModal] = useState<{ open: boolean; shipment: any | null }>({ open: false, shipment: null });
  const [eventModal, setEventModal] = useState<{ open: boolean; shipment: any | null }>({ open: false, shipment: null });
  const [qrModal, setQrModal] = useState<{ open: boolean; shipment: any | null }>({ open: false, shipment: null });

  // Forms
  const [createForm, setCreateForm] = useState({ clientId: '', origine: '', destination: '', type_transport: '', poids: '', volume: '' });
  const [newStatut, setNewStatut] = useState('');
  const [newStatutComment, setNewStatutComment] = useState('');
  const [eventComment, setEventComment] = useState('');
  const [eventStatut, setEventStatut] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resShip, resUsers] = await Promise.all([
          getShipments(),
          getUsers()
        ]);
        
        if (resShip.success) setShipments(resShip.data as any[]);
        if (resUsers.success) {
          // Filtrer les clients pour le select
          setClients((resUsers.data as any[]).filter((u: any) => u.role === 'CLIENT'));
        }
      } catch (error) {
        addToast('error', 'Erreur', 'Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

  const filtered = shipments.filter((s) => {
    const clientName = s.client?.user?.nom || s.clientNom || '';
    const matchSearch = !search ||
      s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || s.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  // Créer une expédition
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createShipment({
        clientId: createForm.clientId,
        origine: createForm.origine,
        destination: createForm.destination,
        type_transport: createForm.type_transport,
        poids: parseFloat(createForm.poids) || null,
        volume: parseFloat(createForm.volume) || null,
      });

      if (res.success && res.data) {
        setShipments([res.data, ...shipments]);
        setCreateModal(false);
        setCreateForm({ clientId: '', origine: '', destination: '', type_transport: '', poids: '', volume: '' });
        addToast('success', 'Expédition créée', `Tracking : ${res.data.tracking_number}`);
      } else {
        addToast('error', 'Erreur', res.message || 'Erreur inconnue');
      }
    } catch (error) {
      addToast('error', 'Erreur', 'Impossible de créer l\'expédition');
    }
  };

  // Mettre à jour le statut
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal.shipment || !newStatut) return;
    try {
      const res = await updateShipmentStatus(statusModal.shipment.id, newStatut, newStatutComment);
      
      if (res.success) {
        setShipments((prev) =>
          prev.map((s) => s.id === statusModal.shipment.id ? { ...s, statut: newStatut } : s)
        );
        setStatusModal({ open: false, shipment: null });
        setNewStatut('');
        setNewStatutComment('');
        addToast('success', 'Statut mis à jour', `${statusModal.shipment.tracking_number} → ${getStatusInfo(newStatut).label}`);
      } else {
        addToast('error', 'Erreur', res.message || 'Erreur');
      }
    } catch (error) {
      addToast('error', 'Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  // Ajouter un événement
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventModal.shipment || !eventComment) return;
    try {
      const res = await addShipmentEvent(eventModal.shipment.id, eventStatut, eventComment);
      if (res.success) {
        setEventModal({ open: false, shipment: null });
        setEventComment('');
        setEventStatut('');
        addToast('info', 'Événement ajouté', eventComment);
        // On pourrait recharger l'expédition ici ou l'ajouter manuellement au state
      } else {
        addToast('error', 'Erreur', res.message || 'Erreur');
      }
    } catch (error) {
      addToast('error', 'Erreur', 'Impossible d\'ajouter l\'événement');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h2 className={styles.pageTitle}>Gestion des Expéditions & Tracking</h2>
          <span className={styles.count}>{filtered.length} expédition{filtered.length > 1 ? 's' : ''}</span>
        </div>
        <div className={styles.toolbarRight}>
          <input
            type="text"
            placeholder="Rechercher (tracking, client...)"
            className={`form-input ${styles.searchInput}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher une expédition"
          />
          <select
            className={`form-select ${styles.filterSelect}`}
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {SHIPMENT_STATUSES.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} />
            <span>Nouvelle expédition</span>
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="table-container">
        <div className="table-scroll">
          <table className="table" aria-label="Liste des expéditions">
            <thead>
              <tr>
                <th>Tracking N°</th>
                <th>Client</th>
                <th>Trajet</th>
                <th>Transport</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Créé par</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((s) => (
                <tr key={s.id}>
                  <td><strong style={{ fontFamily: 'monospace' }}>{s.tracking_number}</strong></td>
                  <td>{s.client?.user?.nom || s.clientNom}</td>
                  <td style={{ fontSize: '0.8rem' }}>{s.origine} → {s.destination}</td>
                  <td style={{ fontSize: '0.8rem' }}>{s.type_transport}</td>
                  <td>
                    <span className={styles.statusBadge} style={{ color: getStatusInfo(s.statut).color, background: getStatusInfo(s.statut).bgColor }}>
                      {getStatusInfo(s.statut).label}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                    {s.tracking_events && s.tracking_events.length > 0 && s.tracking_events[0].user?.nom 
                      ? s.tracking_events[0].user.nom 
                      : 'Admin/Système'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setStatusModal({ open: true, shipment: s }); setNewStatut(s.statut); }}
                        title="Modifier le statut"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit3 size={13} />
                        <span>Statut</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setEventModal({ open: true, shipment: s }); setEventStatut(s.statut); }}
                        title="Ajouter un événement"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <MapPin size={13} />
                        <span>Événement</span>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setQrModal({ open: true, shipment: s })}
                        title="Afficher le Code QR"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <QrCode size={13} />
                        <span>QR</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className={styles.noData}>Aucune expédition trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal : Créer une expédition ── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Créer une nouvelle expédition"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setCreateModal(false)}>Annuler</button>
            <button className="btn btn-primary" form="form-create" type="submit">Créer l'expédition</button>
          </>
        }
      >
        <form id="form-create" onSubmit={handleCreate}>
          <div className="form-group">
            <label htmlFor="clientId" className="form-label">Client *</label>
            <select id="clientId" className="form-select" required value={createForm.clientId} onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}>
              <option value="">-- Sélectionner un client --</option>
              {clients.map((c) => <option key={c.id} value={c.client?.id || c.id}>{c.nom} ({c.email})</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="origine" className="form-label">Origine *</label>
              <input id="origine" className="form-input" required placeholder="New York" value={createForm.origine} onChange={(e) => setCreateForm({ ...createForm, origine: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="dest" className="form-label">Destination *</label>
              <input id="dest" className="form-input" required placeholder="Conakry" value={createForm.destination} onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="transport" className="form-label">Type de transport *</label>
            <select id="transport" className="form-select" required value={createForm.type_transport} onChange={(e) => setCreateForm({ ...createForm, type_transport: e.target.value })}>
              <option value="">-- Choisir --</option>
              {TRANSPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="poids" className="form-label">Poids (kg)</label>
              <input id="poids" type="number" step="0.1" className="form-input" placeholder="Ex: 12.5" value={createForm.poids} onChange={(e) => setCreateForm({ ...createForm, poids: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="volume" className="form-label">Volume (m³)</label>
              <input id="volume" type="number" step="0.01" className="form-input" placeholder="Ex: 0.5" value={createForm.volume} onChange={(e) => setCreateForm({ ...createForm, volume: e.target.value })} />
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Modal : Modifier le statut ── */}
      <Modal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, shipment: null })}
        title={`Modifier le statut — ${statusModal.shipment?.tracking_number}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setStatusModal({ open: false, shipment: null })}>Annuler</button>
            <button className="btn btn-primary" form="form-status" type="submit">Mettre à jour</button>
          </>
        }
      >
        <form id="form-status" onSubmit={handleStatusUpdate}>
          <div className={styles.statusGrid}>
            {SHIPMENT_STATUSES.map((s) => {
              const currentIdx = STATUS_ORDER.indexOf(statusModal.shipment?.statut);
              const sIdx = STATUS_ORDER.indexOf(s.code);
              const isPast = sIdx < currentIdx;
              return (
                <label
                  key={s.code}
                  className={`${styles.statusOption} ${newStatut === s.code ? styles.statusOptionSelected : ''} ${isPast ? styles.statusOptionPast : ''}`}
                  style={newStatut === s.code ? { borderColor: s.color, background: s.bgColor } : {}}
                >
                  <input
                    type="radio"
                    name="statut"
                    value={s.code}
                    checked={newStatut === s.code}
                    onChange={() => setNewStatut(s.code)}
                    className="sr-only"
                  />
                  <span className={styles.statusOptIcon}>{s.icon}</span>
                  <span className={styles.statusOptLabel}>{s.label}</span>
                  {isPast && <span className={styles.statusOptTag}>Passé</span>}
                </label>
              );
            })}
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="status-comment" className="form-label">Commentaire (optionnel)</label>
            <textarea
              id="status-comment"
              className="form-textarea"
              placeholder="Ex : Colis embarqué sur le vol AF802..."
              rows={3}
              value={newStatutComment}
              onChange={(e) => setNewStatutComment(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* ── Modal : Ajouter un événement ── */}
      <Modal
        isOpen={eventModal.open}
        onClose={() => setEventModal({ open: false, shipment: null })}
        title={`Ajouter un événement — ${eventModal.shipment?.tracking_number}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setEventModal({ open: false, shipment: null })}>Annuler</button>
            <button className="btn btn-primary" form="form-event" type="submit">Ajouter l'événement</button>
          </>
        }
      >
        <form id="form-event" onSubmit={handleAddEvent}>
          <div className="form-group">
            <label htmlFor="ev-statut" className="form-label">Statut associé</label>
            <select id="ev-statut" className="form-select" value={eventStatut} onChange={(e) => setEventStatut(e.target.value)}>
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s.code} value={s.code}>{s.icon} {s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ev-comment" className="form-label">Commentaire *</label>
            <textarea
              id="ev-comment"
              className="form-textarea"
              required
              placeholder="Ex : Colis retenu en douane pour vérification..."
              rows={4}
              value={eventComment}
              onChange={(e) => setEventComment(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ev-date" className="form-label">Date et heure (optionnel)</label>
            <input id="ev-date" type="datetime-local" className="form-input" />
          </div>
        </form>
      </Modal>

      {/* ── Modal : Code QR ── */}
      <Modal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, shipment: null })}
        title={`Code QR — ${qrModal.shipment?.tracking_number}`}
        footer={
          <button className="btn btn-primary" onClick={() => setQrModal({ open: false, shipment: null })}>Fermer</button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '2rem 1rem' }}>
          {qrModal.shipment && (
            <>
              <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <QRCodeCanvas value={qrModal.shipment.tracking_number} size={220} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                  {qrModal.shipment.tracking_number}
                </p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Scannez ce code pour suivre l'expédition ou mettre à jour son statut depuis l'outil de scan.
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
