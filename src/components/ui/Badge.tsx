import React from 'react';

type BadgeVariant = 'pending' | 'in-transit' | 'delivered' | 'cancelled' | 'info' | 'admin';

const labels: Record<BadgeVariant, string> = {
  'pending':    'En attente',
  'in-transit': 'En transit',
  'delivered':  'Livré',
  'cancelled':  'Annulé',
  'info':       'Info',
  'admin':      'Admin',
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
}

export default function Badge({ variant, label }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`} aria-label={`Statut: ${label ?? labels[variant]}`}>
      {label ?? labels[variant]}
    </span>
  );
}

// Utilitaire pour convertir un statut API en variant de badge
export function statusToVariant(statut: string): BadgeVariant {
  switch (statut.toUpperCase()) {
    case 'PENDING':    return 'pending';
    case 'IN_TRANSIT': return 'in-transit';
    case 'DELIVERED':  return 'delivered';
    case 'CANCELLED':  return 'cancelled';
    case 'ADMIN':      return 'admin';
    default:           return 'info';
  }
}
