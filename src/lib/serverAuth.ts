import bcrypt from 'bcrypt';

/**
 * Hash un mot de passe avec bcrypt côté serveur.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 10);
}
