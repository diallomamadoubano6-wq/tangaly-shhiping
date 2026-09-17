// Wallet utility — gestion des soldes par compte
// Stocké dans localStorage pour partage entre pages

export type AccountId = 'admin' | 'agent_matam' | 'agent_conakry' | 'agent_labe' | 'agent_kindia' | 'agent_mamou';

export const ACCOUNTS: Record<AccountId, { label: string; role: 'admin' | 'agent' }> = {
  admin:          { label: 'Administration TANGALY', role: 'admin' },
  agent_matam:    { label: 'Diallo (Agence Matam)', role: 'agent' },
  agent_conakry:  { label: 'Camara (Agence Conakry)', role: 'agent' },
  agent_labe:     { label: 'Barry (Agence Labé)', role: 'agent' },
  agent_kindia:   { label: 'Bah (Agence Kindia)', role: 'agent' },
  agent_mamou:    { label: 'Sow (Agence Mamou)', role: 'agent' },
};

const STORAGE_KEY = 'tangaly_wallets';

const DEFAULT_BALANCES: Record<AccountId, { USD: number; GNF: number }> = {
  admin:         { USD: 10000, GNF: 50000000 },
  agent_matam:   { USD: 2500,  GNF: 5000000  },
  agent_conakry: { USD: 1800,  GNF: 3500000  },
  agent_labe:    { USD: 1200,  GNF: 2000000  },
  agent_kindia:  { USD: 900,   GNF: 1500000  },
  agent_mamou:   { USD: 600,   GNF: 800000   },
};

export function getWallets(): Record<AccountId, { USD: number; GNF: number }> {
  if (typeof window === 'undefined') return DEFAULT_BALANCES;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BALANCES));
    return DEFAULT_BALANCES;
  }
  return JSON.parse(stored);
}

export function getBalance(accountId: AccountId): { USD: number; GNF: number } {
  return getWallets()[accountId];
}

export function transfer(
  fromId: AccountId,
  toId: AccountId,
  amount: number,
  currency: 'USD' | 'GNF'
): { success: boolean; error?: string } {
  const wallets = getWallets();
  const fromBalance = wallets[fromId][currency];

  if (fromBalance < amount) {
    return { success: false, error: `Solde insuffisant. Disponible : ${fromBalance.toLocaleString()} ${currency}` };
  }

  wallets[fromId][currency] -= amount;
  wallets[toId][currency] += amount;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  return { success: true };
}

export function formatBalance(amount: number, currency: 'USD' | 'GNF'): string {
  if (currency === 'USD') return `$${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${amount.toLocaleString('fr-FR')} GNF`;
}

export function labelToAccountId(label: string): AccountId | null {
  const entry = Object.entries(ACCOUNTS).find(([_, v]) => v.label === label);
  return entry ? (entry[0] as AccountId) : null;
}
