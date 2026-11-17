'use client';

import { useEffect } from 'react';
import { publicTracking } from '@/actions/public';

/**
 * Composant client WebMCP : enregistre les outils dans le navigateur pour les agents d'IA
 * (Perplexity, Claude, ChatGPT in-browser, etc.) via navigator.modelContext.registerTool().
 */
export default function WebMCPRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Définition des outils WebMCP
    const tools = [
      {
        name: 'track_shipment',
        description: 'Rechercher le statut, la progression et les étapes de livraison d\'un colis TANGALY via son numéro de tracking TGL (ex: TGL-2026-XXXX).',
        inputSchema: {
          type: 'object',
          properties: {
            trackingNumber: {
              type: 'string',
              description: 'Le numéro de suivi du colis TGL',
            },
          },
          required: ['trackingNumber'],
        },
        execute: async ({ trackingNumber }: { trackingNumber: string }) => {
          try {
            const res = await publicTracking(trackingNumber);
            return res;
          } catch (err: any) {
            return { success: false, message: err.message || 'Erreur de recherche' };
          }
        },
      },
      {
        name: 'get_shipping_rates_and_services',
        description: 'Consulter la grille tarifaire officielle et les modes de transport de fret aérien et maritime entre les USA et la Guinée.',
        inputSchema: {
          type: 'object',
          properties: {
            transportType: {
              type: 'string',
              enum: ['AIR', 'SEA'],
              description: 'Mode de transport (AIR pour aérien, SEA pour maritime)',
            },
          },
        },
        execute: async ({ transportType }: { transportType?: string }) => {
          return {
            rates: [
              {
                mode: 'AÉRIEN (AIR)',
                delai: '48h à 72h',
                description: 'Fret aérien express USA ↔ Guinée (dans les deux sens)',
                tarifBase: '$12 / kg',
              },
              {
                mode: 'MARITIME (SEA)',
                delai: '30 à 45 jours',
                description: 'Groupage et conteneurs maritimes complets New York ↔ Port de Conakry',
                tarifBase: 'Par volume (mètres cubes ou carton standard)',
              },
            ],
            currency: 'USD',
            filter: transportType || 'ALL',
          };
        },
      },
      {
        name: 'get_agency_locations',
        description: 'Obtenir les adresses, téléphones et contacts directs des agences TANGALY à New York et à Conakry.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        execute: async () => {
          return {
            agencies: [
              {
                country: 'USA',
                name: 'Agence New York (Bronx)',
                address: '3429 3rd Ave, Bronx, NY 10456',
                phone: '+1 (646) 382-0065',
              },
              {
                country: 'USA',
                name: 'Agence New York (Brooklyn)',
                address: '28 Arlington Avenue, Brooklyn, NY 11207',
                phone: '+1 (646) 382-0065',
              },
              {
                country: 'Guinée',
                name: 'Agence Conakry (Enco 5)',
                address: 'Cité Enco 5, Conakry',
                phone: '+224 626 98 52 54',
              },
            ],
            email: 'contact@tangalyshipping.com',
            whatsapp: '+1 (646) 382-0065',
          };
        },
      },
    ];

    // 1. Enregistrement via navigator.modelContext.registerTool() si disponible
    const nav = navigator as any;
    if (nav.modelContext && typeof nav.modelContext.registerTool === 'function') {
      try {
        tools.forEach((tool) => {
          nav.modelContext.registerTool(tool);
        });
      } catch (e) {
        console.warn('WebMCP registration warning:', e);
      }
    } else {
      // Polyfill modelContext sur navigator pour les agents inspectant la propriété
      if (!nav.modelContext) {
        const registered = new Map();
        nav.modelContext = {
          registerTool: (tool: any) => {
            registered.set(tool.name, tool);
          },
          getTools: () => Array.from(registered.values()),
        };
        tools.forEach((tool) => {
          nav.modelContext.registerTool(tool);
        });
      }
    }

    // 2. Exposition globale pour les assistants IA in-browser
    (window as any).modelContext = (navigator as any).modelContext;
    (window as any).tangalyAgentTools = tools;
  }, []);

  return null;
}

