import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.shipment.findMany({ take: 3 });
  console.log('Existing shipments:', existing.map(s => s.tracking_number));

  if (existing.length === 0) {
    const client = await prisma.client.findFirst({
      include: { user: true }
    });

    if (client) {
      const sample = await prisma.shipment.create({
        data: {
          tracking_number: 'TGL-USA-2024-8891',
          clientId: client.id,
          origine: 'New York, USA',
          destination: 'Conakry, Guinée',
          type_transport: 'Fret Aérien Express',
          poids: 14.5,
          boxes: 2,
          statut: 'RECEIVED',
          description: 'Équipements électroniques et effets personnels',
          tracking_events: {
            create: {
              statut: 'RECEIVED',
              commentaire: 'Colis réceptionné au hub New York JFK',
              localisation: 'New York JFK, USA'
            }
          }
        }
      });
      console.log('Created sample shipment:', sample.tracking_number);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
