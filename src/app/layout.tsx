import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientAuthProvider } from '@/lib/clientAuth';
import WhatsAppButton from '@/components/layout/WhatsAppButton';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#0052cc',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://tangalyshipping.com'),
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
    url: 'https://tangalyshipping.com',
  },
};

import { ToastProvider } from '@/components/ui/ToastProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientAuthProvider>
          <ToastProvider>
            {children}
            <WhatsAppButton />
          </ToastProvider>
        </ClientAuthProvider>
      </body>
    </html>
  );
}
