'use server';

import { prisma } from '@/lib/prisma';

export async function getHomeData() {
  let services: any[] = [];
  let faqs: any[] = [];

  try {
    services = await prisma.service.findMany({
      where: { actif: true }
    });
    faqs = await prisma.faq.findMany({
      orderBy: { ordre: 'asc' }
    });
  } catch (error) {
    console.warn("Could not query database during render/build, using fallback data:", error);
  }

  // Fallback services si la base de données est vide ou fraîchement déployée
  const defaultServices = [
    { id: '1', titre: 'Fret Aérien', description: 'Transport aérien express USA-Guinée en 48-72h.', image: '/images/service-air.jpg' },
    { id: '2', titre: 'Fret Maritime', description: 'Groupage et conteneurs maritimes sécurisés.', image: '/images/service-sea.jpg' },
    { id: '3', titre: 'Entreposage', description: 'Stockage sécurisé à New York et Conakry.', image: '/images/service-warehouse.jpg' },
  ];

  const effectiveServices = services.length > 0 ? services : defaultServices;

  return {
    data: {
      hero: {
        headline: "Expédiez vos colis vers la Guinée en toute sérénité",
        subheadline: "La solution logistique de confiance entre les États-Unis et l'Afrique de l'Ouest.",
        cta1: { href: "/client/dashboard", label: "Mon Espace" },
        cta2: { href: "/devis", label: "Demander un devis" }
      },
      stats: [
        { value: "5k+", label: "Colis livrés" },
        { value: "99%", label: "Clients satisfaits" },
        { value: "12", label: "Villes desservies" }
      ],
      process: [
        { title: "Réception", desc: "Nous recevons vos colis à notre entrepôt de NY." },
        { title: "Préparation", desc: "Emballage sécurisé de vos marchandises." },
        { title: "Expédition", desc: "Transport maritime ou aérien." },
        { title: "Livraison", desc: "Retrait à Conakry ou livraison à domicile." }
      ],
      services: effectiveServices.map((s: any) => ({
        id: s.id,
        href: '/services',
        image_url: s.image || '/images/service-air.jpg',
        titre: s.titre,
        description: s.description
      })),
      whyUs: [
        { title: "Sécurité", icon: "🛡️", description: "Vos colis sont assurés et tracés." },
        { title: "Rapidité", icon: "⚡", description: "Les meilleurs délais du marché." },
        { title: "Support", icon: "💬", description: "Une équipe à votre écoute 7j/7." }
      ],
      faq: faqs.map((f: any) => ({
        q: f.question,
        a: f.reponse
      }))
    }
  };
}


function generateQuoteRef() {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2);
  const random = Math.floor(100 + Math.random() * 900);
  return `Q-${date}${random}`;
}

export async function submitQuote(data: {
  client_nom: string;
  client_email: string;
  client_tel: string;
  service: string;
  origine: string;
  destination: string;
  poids_estime: string;
  message: string;
}) {
  try {
    const quote = await prisma.quote.create({
      data: {
        client_nom: data.client_nom,
        client_email: data.client_email,
        client_tel: data.client_tel || null,
        service: data.service,
        origine: data.origine,
        destination: data.destination,
        poids_estime: data.poids_estime || null,
        message: data.message,
        statut: 'PENDING',
      }
    });

    return { success: true, quote };
  } catch (error) {
    console.error("Error submitting quote:", error);
    return { success: false, message: 'Erreur lors de la soumission du devis' };
  }
}

export async function publicTracking(trackingNumber: string) {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { tracking_number: trackingNumber },
      include: {
        tracking_events: {
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!shipment) {
      return { success: false, message: 'Colis introuvable' };
    }

    return { success: true, data: shipment };
  } catch (error) {
    console.error("Error tracking shipment:", error);
    return { success: false, message: 'Erreur lors de la recherche' };
  }
}
