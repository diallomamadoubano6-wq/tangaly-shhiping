'use server';

import { prisma } from '@/lib/prisma';

export async function getHomeData() {
  let services: any[] = [];
  let faqs: any[] = [];
  let cmsHero: any = null;
  let cmsStats: any = null;

  try {
    const [dbServices, dbFaqs, dbSettings] = await Promise.all([
      prisma.service.findMany({ where: { actif: true } }),
      prisma.faq.findMany({ orderBy: { ordre: 'asc' } }),
      prisma.cmsSetting.findMany()
    ]);
    services = dbServices;
    faqs = dbFaqs;
    const settingsMap: Record<string, string> = {};
    dbSettings.forEach(s => { settingsMap[s.key] = s.value; });
    if (settingsMap['hero']) {
      try { cmsHero = JSON.parse(settingsMap['hero']); } catch (e) {}
    }
    if (settingsMap['stats']) {
      try { cmsStats = JSON.parse(settingsMap['stats']); } catch (e) {}
    }
  } catch (error) {
    console.warn("Could not query database during render/build, using fallback data:", error);
  }

  // Services phares : Aérien et Maritime uniquement
  const defaultServices = [
    { id: '1', titre: 'Fret Aérien Express', description: 'Transport aérien rapide USA ↔ Guinée (dans les deux sens) en 48-72h.', image: '/images/service-air.jpg' },
    { id: '2', titre: 'Fret Maritime Sécurisé', description: 'Groupage et conteneurs maritimes réguliers entre les États-Unis et la Guinée.', image: '/images/service-sea.jpg' },
  ];

  const effectiveServices = services.length > 0 ? services : defaultServices;

  return {
    data: {
      hero: {
        headline: cmsHero?.headline || "Expédiez vos colis entre les USA et la Guinée en toute sérénité",
        subheadline: cmsHero?.subheadline || "La solution logistique de confiance pour tous vos envois : depuis les États-Unis vers la Guinée et depuis la Guinée vers les États-Unis.",
        cta1: { href: "/client/dashboard", label: "Mon Espace" },
        cta2: { href: "/devis", label: "Demander un devis" }
      },
      stats: (cmsStats && Array.isArray(cmsStats) && cmsStats.length > 0) ? cmsStats : [
        { value: "5k+", label: "Colis livrés" },
        { value: "99%", label: "Clients satisfaits" },
        { value: "12", label: "Villes desservies" }
      ],
      process: [
        { title: "Dépôt & Réception", desc: "Déposez vos colis à New York ou Conakry, ou demandez un enlèvement sur place." },
        { title: "Préparation", desc: "Contrôle, pesage certifié et emballage renforcé pour un transport sécurisé." },
        { title: "Expédition Bilatérale", desc: "Acheminement rapide dans les deux sens par fret aérien express ou fret maritime." },
        { title: "Livraison Finale", desc: "Retrait en agence ou livraison directe à domicile aux USA ou en Guinée." }
      ],
      services: effectiveServices.map((s: any) => ({
        id: s.id,
        href: '/services',
        image_url: s.image || '/images/service-air.jpg',
        titre: s.titre,
        description: s.description
      })),
      whyUs: [
        { title: "Liaison Bilatérale", icon: "repeat", description: "Départs réguliers dans les 2 sens : USA ➔ Guinée et Guinée ➔ USA." },
        { title: "Sécurité & Traçabilité", icon: "shield", description: "Vos colis sont assurés, pesés avec rigueur et tracés en temps réel." },
        { title: "Support Dédié 7j/7", icon: "message", description: "Des équipes bilingues basées localement à New York et à Conakry." }
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
