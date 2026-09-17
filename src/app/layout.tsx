import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientAuthProvider } from '@/lib/clientAuth';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#0052cc',
};

export const metadata: Metadata = {
  title: {
    template: '%s | TANGALY Shipping & Logistics',
    default: 'TANGALY Shipping & Logistics — Transport USA ↔ Guinée',
  },
  description:
    'TANGALY, votre partenaire de confiance pour le transport et la logistique entre les États-Unis et la Guinée.',
  keywords: ['transport', 'logistique', 'expédition', 'USA', 'Guinée', 'shipping', 'TANGALY'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'TANGALY Shipping & Logistics',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientAuthProvider>
          {children}
        </ClientAuthProvider>
      </body>
    </html>
  );
}
