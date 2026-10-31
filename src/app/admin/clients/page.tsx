'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import { useToast, useConfirm } from '@/components/ui/ToastProvider';
import { getClients } from '@/actions/clients';

const columns = [
  { key: 'nom', label: 'Nom du client' },
  { key: 'email', label: 'Email' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'adresse', label: 'Adresse' },
];

export default function ClientsPage() {
  const { addToast } = useToast();
  const confirm = useConfirm();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await getClients();
        if (res.success && res.data) {
          // Format data for DataTable
          const formatted = res.data.map((c: any) => ({
            id: c.id,
            nom: c.user?.nom || 'Inconnu',
            email: c.user?.email || 'N/A',
            telephone: c.telephone || 'N/A',
            adresse: c.adresse || 'N/A'
          }));
          setClients(formatted);
        }
      } catch (error) {
        addToast('error', 'Erreur', 'Impossible de charger les clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [addToast]);

  const handleEdit = (row: any) => {
    addToast('info', 'Fiche client', `Consultation du client ${row.nom}`);
  };

  const handleDelete = async (row: any) => {
    const ok = await confirm({
      title: 'Supprimer ce client ?',
      message: `Voulez-vous vraiment supprimer le client "${row.nom}" ? Cette action est irréversible.`,
      type: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });
    if (ok) {
      addToast('success', 'Client supprimé', `Le client ${row.nom} a été supprimé.`);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>Gestion des Clients</h2>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>
      ) : (
        <DataTable 
          title="Liste des Clients" 
          columns={columns} 
          data={clients} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
