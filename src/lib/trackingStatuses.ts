// ============================================================
// Statuts officiels des expéditions TANGALY
// Source unique de vérité — partagée entre frontend et backend
// ============================================================

export const SHIPMENT_STATUSES = [
  {
    code: 'CREATED',
    label: 'Créé',
    labelFr: 'Expédition créée',
    description: 'Votre expédition a été enregistrée dans notre système.',
    icon: 'FileEdit',
    color: '#718096',
    bgColor: '#f7fafc',
  },
  {
    code: 'RECEIVED',
    label: 'Réceptionné',
    labelFr: 'Colis réceptionné',
    description: 'Votre colis a été physiquement reçu dans notre entrepôt.',
    icon: 'Package',
    color: '#d69e2e',
    bgColor: '#fffff0',
  },
  {
    code: 'PREPARING',
    label: 'Préparation',
    labelFr: 'En cours de préparation',
    description: 'Votre colis est en cours d\'emballage et de vérification douanière.',
    icon: 'Cog',
    color: '#3182ce',
    bgColor: '#ebf8ff',
  },
  {
    code: 'SHIPPED',
    label: 'Expédié',
    labelFr: 'En transit',
    description: 'Votre colis est en route vers sa destination.',
    icon: 'Plane',
    color: '#0052cc',
    bgColor: '#e8f0fe',
  },
  {
    code: 'ARRIVED',
    label: 'Arrivé',
    labelFr: 'Arrivé à destination',
    description: 'Votre colis est arrivé et est en cours de dédouanement local.',
    icon: 'MapPin',
    color: '#805ad5',
    bgColor: '#faf5ff',
  },
  {
    code: 'DELIVERED',
    label: 'Livré',
    labelFr: 'Livré',
    description: 'Votre colis a été livré avec succès.',
    icon: 'CheckCircle2',
    color: '#38a169',
    bgColor: '#f0fff4',
  },
] as const;

export type ShipmentStatusCode = typeof SHIPMENT_STATUSES[number]['code'];

export const STATUS_ORDER: ShipmentStatusCode[] = [
  'CREATED', 'RECEIVED', 'PREPARING', 'SHIPPED', 'ARRIVED', 'DELIVERED',
];

export function getStatusInfo(code: string) {
  return SHIPMENT_STATUSES.find((s) => s.code === code) ?? SHIPMENT_STATUSES[0];
}

export function getStatusIndex(code: string) {
  return STATUS_ORDER.indexOf(code as ShipmentStatusCode);
}
