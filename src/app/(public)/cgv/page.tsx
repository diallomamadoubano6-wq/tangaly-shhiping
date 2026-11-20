import type { Metadata } from 'next';
import CGVContent from './CGVContent';
import { getPublicContactInfo } from '@/actions/cms';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente (CGV) & Terms of Service | TANGALY Shipping & Logistics',
  description: 'Conditions générales de vente et de transport (FR / EN) régissant les expéditions de fret aérien et maritime entre les USA et la Guinée avec TANGALY Shipping.',
  alternates: {
    canonical: 'https://tangalyshipping.com/cgv',
  },
};

export default async function CGVPage() {
  const contact = await getPublicContactInfo();
  return <CGVContent contact={contact} />;
}
