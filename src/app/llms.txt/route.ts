import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const markdown = `# TANGALY Shipping & Logistics

> TANGALY Shipping & Logistics est une entreprise internationale de fret et de transport bilatéral de marchandises reliant les États-Unis d'Amérique (USA) et la République de Guinée (Conakry).

## Présentation générale
TANGALY propose des services de fret aérien express et de fret maritime régulier (groupage et conteneurs complets) opérant dans les deux sens : depuis les États-Unis vers la Guinée et depuis la Guinée vers les États-Unis. La plateforme intègre un espace client sécurisé, le suivi de colis en temps réel par code barre / QR code, ainsi que l'estimation instantanée de devis.

## Agences et Hubs logistiques
- **Hub USA (New York)** : 3429 3rd Ave, Bronx, NY 10456 / 28 Arlington Avenue, Brooklyn, NY 11207. Téléphone : +1 (646) 382-0065.
- **Hub Guinée (Conakry)** : Cité Enco 5, Conakry. Téléphone : +224 626 98 52 54.
- **Email officiel** : contact@tangalyshipping.com
- **Site officiel** : https://tangalyshipping.com

## Pages principales & Services
- [Accueil](https://tangalyshipping.com/): Présentation de l'entreprise, simulateur rapide et recherche de colis.
- [Services](https://tangalyshipping.com/services): Fret aérien express (48h–72h), fret maritime sécurisé, groupage, formalités de transit et dédouanement.
- [Suivi de colis](https://tangalyshipping.com/tracking): Outil de suivi public en temps réel avec numéro d'expédition TGL.
- [Devis en ligne](https://tangalyshipping.com/devis): Calculateur automatique des tarifs d'expédition selon le poids, les dimensions et la valeur déclarée.
- [À propos](https://tangalyshipping.com/about): Histoire, mission, engagements et valeurs de TANGALY Shipping.
- [Actualités & Blog](https://tangalyshipping.com/blog): Guides d'expédition, conseils d'emballage et actualités logistiques.
- [Contact](https://tangalyshipping.com/contact): Formulaire de message direct, numéros de téléphone et localisation des agences.
- [Conditions Générales (CGV)](https://tangalyshipping.com/cgv): Termes de transport, responsabilités et assurances.
- [Politique de Confidentialité](https://tangalyshipping.com/confidentialite): Protection des données personnelles des expéditeurs et destinataires.

## Outils pour Agents IA (WebMCP & MCP)
- **MCP Server Card** : https://tangalyshipping.com/.well-known/mcp/server-card.json
- **Endpoint MCP** : https://tangalyshipping.com/api/mcp
- **Outil de suivi** : track_shipment(trackingNumber)
- **Outil de calcul** : calculate_quote(transportType, weight, volume)
`;

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
    },
  });
}
