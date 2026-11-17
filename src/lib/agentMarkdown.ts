/**
 * Représentation Markdown structurée du site pour les agents IA
 * (Réduction drastique de tokens et optimisation de la lisibilité agentique).
 */
export function getAgentMarkdown(pathname: string): string {
  const cleanPath = pathname.replace(/\/$/, '') || '/';

  switch (cleanPath) {
    case '/':
      return `# TANGALY Shipping & Logistics — Transport Bilatéral USA ↔ Guinée

> La référence de la logistique et du transport de marchandises entre les États-Unis et la République de Guinée (dans les deux sens).

## Services Phares
1. **Fret Aérien Express (48h à 72h)** : Envois urgents, colis commerciaux, effets personnels, documents confidentiels. Liaisons directes USA ↔ Guinée.
2. **Fret Maritime Sécurisé** : Groupage maritime régulier et conteneurs complets (FCL/LCL). Départs fréquents New York ↔ Port de Conakry.

## Hubs & Agences
- **Agence USA** : 3429 3rd Ave, Bronx, NY 10456 / 28 Arlington Ave, Brooklyn, NY 11207. Tél : +1 (646) 382-0065
- **Agence Guinée** : Cité Enco 5, Conakry. Tél : +224 626 98 52 54
- **Email** : contact@tangalyshipping.com

## Accès Rapides
- Suivi de colis : https://tangalyshipping.com/tracking
- Demande de devis gratuit : https://tangalyshipping.com/devis
- Espace Client : https://tangalyshipping.com/login
`;

    case '/services':
      return `# Services de Transport et Logistique — TANGALY Shipping

## 1. Fret Aérien Express
- Départs hebdomadaires réguliers.
- Délais : 48 à 72 heures entre les États-Unis et Conakry.
- Prise en charge des colis fragiles, électroniques et effets personnels.

## 2. Fret Maritime & Groupage
- Expéditions par conteneurs partagés (groupage) ou conteneurs dédiés.
- Solution la plus économique pour les gros volumes, véhicules et matériels lourds.

## 3. Formalités Douanières & Transit
- Prise en charge complète du dédouanement à l'arrivée au Port et à l'Aéroport de Conakry.
- Livraison à domicile ou retrait direct en agence locale.
`;

    case '/tracking':
      return `# Suivi de Colis — TANGALY Shipping

Entrez votre numéro de suivi TGL (ex: TGL-2026-XXXXXX) pour suivre votre colis en temps réel.
URL de l'outil : https://tangalyshipping.com/tracking
`;

    case '/devis':
      return `# Demande de Devis — TANGALY Shipping

Calculez le coût estimé de votre envoi entre les USA et la Guinée selon :
- Le mode de transport (Aérien Express ou Maritime)
- Le poids réel en kg
- Les dimensions du colis (Volume)
- La valeur déclarée

Formulaire interactif : https://tangalyshipping.com/devis
`;

    case '/contact':
      return `# Contactez TANGALY Shipping & Logistics

- **USA (New York)** : 3429 3rd Ave, Bronx, NY 10456 | Tél : +1 (646) 382-0065
- **Guinée (Conakry)** : Cité Enco 5 | Tél : +224 626 98 52 54
- **Email** : contact@tangalyshipping.com
- **WhatsApp** : https://wa.me/16463820065
`;

    default:
      return `# TANGALY Shipping & Logistics
Page : ${cleanPath}
Site web officiel : https://tangalyshipping.com
Pour plus d'informations, consultez https://tangalyshipping.com/llms.txt
`;
  }
}
