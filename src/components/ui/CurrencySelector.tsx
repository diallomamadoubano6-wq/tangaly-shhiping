'use client';

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';

interface CurrencySelectorProps {
  showRate?: boolean;
  className?: string;
}

export default function CurrencySelector({ showRate = false, className = '' }: CurrencySelectorProps) {
  const { currency, setCurrency, exchangeRate } = useCurrency();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
      className={className}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: 9999,
          padding: 3,
          gap: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setCurrency('USD')}
          style={{
            border: 'none',
            background: currency === 'USD' ? '#2563eb' : 'transparent',
            color: currency === 'USD' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: 11,
            padding: '5px 11px',
            borderRadius: 9999,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: currency === 'USD' ? '0 1px 3px rgba(37,99,235,0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
          title="Afficher les montants en Dollars US ($ USD)"
        >
          <span>🇺🇸</span> USD ($)
        </button>

        <button
          type="button"
          onClick={() => setCurrency('GNF')}
          style={{
            border: 'none',
            background: currency === 'GNF' ? '#16a34a' : 'transparent',
            color: currency === 'GNF' ? '#ffffff' : '#64748b',
            fontWeight: 700,
            fontSize: 11,
            padding: '5px 11px',
            borderRadius: 9999,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: currency === 'GNF' ? '0 1px 3px rgba(22,163,74,0.35)' : 'none',
            transition: 'all 0.2s ease',
          }}
          title="Afficher les montants en Francs Guinéens (GNF)"
        >
          <span>🇬🇳</span> GNF
        </button>
      </div>

      {showRate && (
        <span
          style={{
            fontSize: 11,
            color: '#64748b',
            whiteSpace: 'nowrap',
          }}
          title="Taux indicatif appliqué pour la conversion"
        >
          (1 $ = {exchangeRate.toLocaleString()} GNF)
        </span>
      )}
    </div>
  );
}
