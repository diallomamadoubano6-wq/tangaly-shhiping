'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Currency = 'USD' | 'GNF';

export const DEFAULT_EXCHANGE_RATE = 8650; // 1 USD = 8 650 GNF

/**
 * Détermine la devise par défaut pour un agent selon son rôle et sa localisation.
 * - Agents USA (Gérant USA, localisation USA/New York, Agence USA) -> 'USD'
 * - Agents Guinée (Gérant Guinée, Agent Conakry, Labé, etc.) -> 'GNF'
 */
export function getAgentCurrency(user: any): Currency {
  if (!user) return 'GNF';
  const role = (user.role || '').toUpperCase();
  const loc = (user.localisation || '').toLowerCase();
  const agencyPays = (user.agency?.pays || '').toUpperCase();

  // Profils USA
  if (role === 'GERANT_USA' || role === 'AGENT_USA') return 'USD';
  if (loc.includes('usa') || loc.includes('york') || loc.includes('etats-unis') || loc.includes('états-unis') || loc.includes('america')) {
    return 'USD';
  }
  if (agencyPays.includes('USA') || agencyPays.includes('UNITED STATES')) {
    return 'USD';
  }

  // Profils Guinée / autres
  return 'GNF';
}

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  // Convertit et formate un montant dont la valeur de base est en USD (ex: expéditions, factures Tangaly)
  formatAmount: (amountUSD: number | string | null | undefined, targetCurrency?: Currency) => string;
  // Convertit et formate un montant dont la valeur de base est en GNF (ex: caisse locale, objectifs GNF)
  formatFromGNF: (amountGNF: number | string | null | undefined, targetCurrency?: Currency) => string;
  // Retourne la valeur numérique convertie
  convertAmount: (amountUSD: number | string | null | undefined, targetCurrency?: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export interface CurrencyProviderProps {
  children: React.ReactNode;
  initialCurrency?: Currency;
  storageKey?: string; // Utilisé par l'Admin pour mémoriser son choix dans localStorage
  defaultExchangeRate?: number;
}

export function CurrencyProvider({
  children,
  initialCurrency = 'USD',
  storageKey,
  defaultExchangeRate = DEFAULT_EXCHANGE_RATE,
}: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<Currency>(initialCurrency);
  const [exchangeRate, setExchangeRate] = useState<number>(defaultExchangeRate);

  // Charger la devise sauvegardée si storageKey est défini
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved === 'USD' || saved === 'GNF') {
          setCurrencyState(saved);
        }
      } catch (e) {
        // Ignorer en mode privé
      }
    }
  }, [storageKey]);

  // Synchroniser avec initialCurrency si storageKey n'est pas défini (ex: pour les agents selon leur session)
  useEffect(() => {
    if (!storageKey) {
      setCurrencyState(initialCurrency);
    }
  }, [initialCurrency, storageKey]);

  const setCurrency = useCallback((newCurr: Currency) => {
    setCurrencyState(newCurr);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, newCurr);
      } catch (e) {
        // Ignorer
      }
    }
  }, [storageKey]);

  const convertAmount = useCallback((amountUSD: number | string | null | undefined, targetCurrency?: Currency) => {
    const val = Number(amountUSD) || 0;
    const curr = targetCurrency || currency;
    return curr === 'GNF' ? Math.round(val * exchangeRate) : val;
  }, [currency, exchangeRate]);

  const formatAmount = useCallback((amountUSD: number | string | null | undefined, targetCurrency?: Currency) => {
    const val = Number(amountUSD) || 0;
    const curr = targetCurrency || currency;
    if (curr === 'GNF') {
      const gnfVal = Math.round(val * exchangeRate);
      return `${gnfVal.toLocaleString('fr-FR')} GNF`;
    }
    return `$${val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }, [currency, exchangeRate]);

  const formatFromGNF = useCallback((amountGNF: number | string | null | undefined, targetCurrency?: Currency) => {
    const val = Number(amountGNF) || 0;
    const curr = targetCurrency || currency;
    if (curr === 'GNF') {
      return `${Math.round(val).toLocaleString('fr-FR')} GNF`;
    }
    const usdVal = val / (exchangeRate || DEFAULT_EXCHANGE_RATE);
    return `$${usdVal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency, exchangeRate]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        exchangeRate,
        setExchangeRate,
        formatAmount,
        formatFromGNF,
        convertAmount,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    const rate = DEFAULT_EXCHANGE_RATE;
    return {
      currency: 'USD',
      setCurrency: () => {},
      exchangeRate: rate,
      setExchangeRate: () => {},
      formatAmount: (amountUSD, target) => {
        const val = Number(amountUSD) || 0;
        return target === 'GNF'
          ? `${Math.round(val * rate).toLocaleString('fr-FR')} GNF`
          : `$${val.toLocaleString('fr-FR')}`;
      },
      formatFromGNF: (amountGNF, target) => {
        const val = Number(amountGNF) || 0;
        return target === 'USD'
          ? `$${(val / rate).toFixed(2)}`
          : `${Math.round(val).toLocaleString('fr-FR')} GNF`;
      },
      convertAmount: (amountUSD, target) => {
        const val = Number(amountUSD) || 0;
        return target === 'GNF' ? Math.round(val * rate) : val;
      },
    };
  }
  return context;
}
