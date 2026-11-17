import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  const serverCard = {
    "$schema": "https://modelcontextprotocol.io/schemas/server-card.json",
    "name": "tangaly-shipping-mcp",
    "version": "1.0.0",
    "title": "TANGALY Shipping & Logistics MCP Server",
    "description": "Serveur MCP officiel de Tangaly Shipping & Logistics pour le fret aérien et maritime bilatéral USA ↔ Guinée. Permet le suivi en temps réel de colis, la consultation des tarifs et agences, et le calcul d'estimation de devis.",
    "endpoint": "https://tangalyshipping.com/api/mcp",
    "transport": {
      "type": "http",
      "url": "https://tangalyshipping.com/api/mcp"
    },
    "capabilities": {
      "tools": {
        "listChanged": false
      },
      "resources": {
        "listChanged": false
      }
    },
    "tools": [
      {
        "name": "track_shipment",
        "description": "Rechercher les informations d'acheminement, le statut actuel et l'historique complet d'un colis TANGALY via son numéro de tracking TGL (ex: TGL-2026-XXXX).",
        "inputSchema": {
          "type": "object",
          "properties": {
            "trackingNumber": {
              "type": "string",
              "description": "Le numéro de tracking du colis (ex: TGL-2026-123456)"
            }
          },
          "required": ["trackingNumber"]
        }
      },
      {
        "name": "get_rates_and_services",
        "description": "Consulter les tarifs officiels par kilogramme ou par volume pour le fret aérien et maritime entre les USA et la Guinée.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "serviceType": {
              "type": "string",
              "enum": ["AIR", "SEA"],
              "description": "Mode de transport souhaité (AIR pour Fret Aérien Express, SEA pour Fret Maritime)"
            }
          }
        }
      },
      {
        "name": "get_agencies",
        "description": "Obtenir les coordonnées, adresses physiques des entrepôts et numéros de téléphone des agences TANGALY à New York (USA) et à Conakry (Guinée).",
        "inputSchema": {
          "type": "object",
          "properties": {}
        }
      }
    ],
    "contact": {
      "name": "TANGALY Shipping & Logistics",
      "email": "contact@tangalyshipping.com",
      "url": "https://tangalyshipping.com"
    }
  };

  return NextResponse.json(serverCard, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
    },
  });
}

