import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Identifiants manquants');
        }

        console.log("Login attempt for email:", credentials.email);
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password_hash) {
          console.log("User not found or no password hash");
          throw new Error('Utilisateur introuvable');
        }

        console.log("Comparing passwords...");
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        console.log("Password valid?", isPasswordValid);
        if (!isPasswordValid) {
          throw new Error('Mot de passe incorrect');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nom,
          nom: user.nom,
          role: user.role,
          localisation: user.localisation || 'Agence Principale',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = (user as any).nom || user.name;
        (token as any).nom = (user as any).nom || user.name;
        (token as any).localisation = (user as any).localisation || 'Agence Principale';
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { 
              id: true, 
              nom: true, 
              email: true, 
              role: true, 
              localisation: true,
              agencyId: true,
              agency: {
                select: { id: true, nom: true, pays: true, ville: true }
              }
            }
          });
          if (freshUser) {
            session.user = {
              ...session.user,
              id: freshUser.id,
              name: freshUser.nom,
              nom: freshUser.nom,
              email: freshUser.email,
              role: freshUser.role,
              localisation: freshUser.localisation || 'Agence Principale',
              agencyId: freshUser.agencyId,
              agency: freshUser.agency,
            } as any;
            return session;
          }
        } catch (e) {
          console.error("Session refresh error:", e);
        }
      }

      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).name = (token as any).nom || (token as any).name;
        (session.user as any).nom = (token as any).nom || (token as any).name;
        (session.user as any).localisation = (token as any).localisation || 'Agence Principale';
      }
      return session;
    },
  },
};
