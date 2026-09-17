'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import { useToast } from '@/components/ui/ToastProvider';
import { getClients } from '@/actions/clients';

const columns = [
  { key: 'nom', label: 'Nom du client' },
  { key: 'email', label: 'Email' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'adresse', label: 'Adresse' },
];

export default function ClientsPage() {
  const { addToast } = useToast();
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
    alert(`Ouvrir la modale d'édition pour le client: ${row.nom}`);
  };

  const handleDelete = (row: any) => {
    if(confirm(`Voulez-vous vraiment supprimer ${row.nom} ?`)) {
      alert(`Client ${row.nom} supprimé.`);
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
