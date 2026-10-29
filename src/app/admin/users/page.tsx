'use client';

import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastProvider';
import { getUsers, getAgencies, createUser, updateUser, deleteUser } from '@/actions/users';
import { Trash2, Edit2, AlertTriangle, UserPlus } from 'lucide-react';

export default function UsersPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    password: '',
    role: 'CLIENT',
    localisation: 'Conakry',
    agencyId: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [resUsers, resAgencies] = await Promise.all([
        getUsers(),
        getAgencies()
      ]);
      
      if (resUsers.success) setUsers(resUsers.data as any[]);
      if (resAgencies.success) setAgencies(resAgencies.data as any[]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      addToast('error', 'Erreur', 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSend = { ...formData };
      let res;

      if (editingUser) {
        res = await updateUser(editingUser.id, dataToSend);
      } else {
        res = await createUser(dataToSend);
      }
      
      if (res.success) {
        addToast('success', 'Succès', editingUser ? 'Utilisateur mis à jour' : 'Utilisateur créé');
        setIsModalOpen(false);
        await loadData();
      } else {
        addToast('error', 'Erreur', res.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      addToast('error', 'Erreur', 'Erreur réseau');
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ nom: '', email: '', password: '', role: 'CLIENT', localisation: 'Conakry', agencyId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({ 
      nom: user.nom, 
      email: user.email, 
      password: '', 
      role: user.role, 
      localisation: user.localisation || 'Conakry', 
      agencyId: user.agencyId || '' 
    });
    setIsModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteUser(userToDelete.id);
      if (res.success) {
        addToast('success', 'Succès', `L'utilisateur "${userToDelete.nom}" a été supprimé avec succès.`);
        setUserToDelete(null);
        await loadData();
      } else {
        addToast('error', 'Erreur', res.message || 'Impossible de supprimer cet utilisateur.');
      }
    } catch (error) {
      addToast('error', 'Erreur', 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gestion des Comptes</h1>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={16} /> Créer un compte
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
        ) : (
          <div className="table-scroll">
            <table className="table" aria-label="Liste des utilisateurs">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Agence</th>
                  <th>Date d'inscription</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.nom}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <Badge 
                        variant={u.role === 'SUPER_ADMIN' ? 'admin' : u.role.includes('GERANT') ? 'in-transit' : 'pending'}
                        label={u.role.replace('_', ' ')}
                      />
                    </td>
                    <td>{u.agency ? `${u.agency.nom} (${u.agency.pays})` : 'N/A'}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEditModal(u)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Edit2 size={13} /> Modifier
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setUserToDelete(u)}
                          style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Supprimer définitivement cet utilisateur"
                        >
                          <Trash2 size={13} /> Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>Aucun utilisateur trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Annuler</button>
            <button className="btn btn-primary" form="user-form" type="submit">{editingUser ? 'Sauvegarder' : 'Créer'}</button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Nom complet *</label>
            <input required type="text" className="form-input" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
          </div>
          {!editingUser && (
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input required type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          )}
          {!editingUser && (
            <div className="form-group">
              <label className="form-label">Mot de passe temporaire *</label>
              <input required type="password" className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Rôle *</label>
            <select className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="CLIENT">Client</option>
              <option value="AGENT">Agent Logistique</option>
              <option value="GERANT_USA">Gérant USA</option>
              <option value="GERANT_GUINEE">Gérant Guinée</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          {(formData.role === 'AGENT' || formData.role === 'GERANT_USA' || formData.role === 'GERANT_GUINEE') && (
            <div className="form-group">
              <label className="form-label">Agence d'affectation</label>
              <select className="form-select" value={formData.agencyId} onChange={e => setFormData({...formData, agencyId: e.target.value})}>
                <option value="">-- Sans agence --</option>
                {agencies.map(a => (
                  <option key={a.id} value={a.id}>{a.nom} ({a.pays})</option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>

      {/* Modal Confirmation de Suppression */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => !isDeleting && setUserToDelete(null)}
        title="Confirmer la suppression"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setUserToDelete(null)} disabled={isDeleting}>
              Annuler
            </button>
            <button
              className="btn"
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
              }}
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              {isDeleting ? 'Suppression en cours...' : 'Oui, supprimer définitivement'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: '#fef2f2',
              borderRadius: 8,
              border: '1px solid #fecaca',
            }}
          >
            <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.4 }}>
              <strong>Action irréversible :</strong> Toutes les données directement associées à cet utilisateur seront supprimées.
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#334155' }}>
            Êtes-vous sûr de vouloir supprimer définitivement le compte de :<br />
            <strong style={{ color: '#0f172a', fontSize: 15 }}>{userToDelete?.nom}</strong> ({userToDelete?.email}) ?
          </p>
          <div
            style={{
              padding: '10px 12px',
              background: '#f8fafc',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              fontSize: 12,
              color: '#64748b',
              display: 'flex',
              gap: 16,
            }}
          >
            <span>
              Rôle : <strong style={{ color: '#0f172a' }}>{userToDelete?.role}</strong>
            </span>
            {userToDelete?.agency && (
              <span>
                Agence : <strong style={{ color: '#0f172a' }}>{userToDelete.agency.nom}</strong>
              </span>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
