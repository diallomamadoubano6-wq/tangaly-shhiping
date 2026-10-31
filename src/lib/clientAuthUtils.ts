import bcrypt from 'bcrypt';

/**
 * Normalise un numéro de téléphone pour la recherche et le stockage.
 * Supprime les espaces, tirets, parenthèses et points.
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\.]/g, '').trim();
}

/**
 * Génère le mot de passe par défaut pour un client créé lors d'une expédition.
 * Règle : 'tangaly' + les 4 derniers chiffres du téléphone (ex: 622 12 34 56 -> 'tangaly3456').
 * Si le numéro comporte moins de 4 chiffres : 'tangaly123'.
 */
export function generateDefaultClientPassword(phone?: string | null): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length >= 4) {
    return `tangaly${digits.slice(-4)}`;
  }
  return 'tangaly123';
}

/**
 * Hash un mot de passe avec bcrypt.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 10);
}
