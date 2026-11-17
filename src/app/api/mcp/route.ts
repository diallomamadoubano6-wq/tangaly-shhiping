import { NextRequest, NextResponse } from 'next/server';
import { publicTracking } from '@/actions/public';

const MCP_TOOLS = [
  {
    name: 'track_shipment',
    description: 'Rechercher les informations d\'acheminement et le statut d\'un colis TANGALY via son numéro de tracking TGL.',
    inputSchema: {
      type: 'object',
      properties: {
        trackingNumber: {
          type: 'string',
          description: 'Le numéro de suivi du colis TGL (ex: TGL-2026-XXXX)',
        },
      },
      required: ['trackingNumber'],
    },
  },
  {
    name: 'get_rates_and_services',
    description: 'Consulter les tarifs officiels par kilogramme ou par volume pour le fret aérien et maritime entre les USA et la Guinée.',
    inputSchema: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          enum: ['AIR', 'SEA'],
          description: 'Mode de transport souhaité (AIR ou SEA)',
        },
      },
    },
  },
  {
    name: 'get_agencies',
    description: 'Obtenir les adresses et téléphones des agences TANGALY à New York et à Conakry.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    server: 'tangaly-shipping-mcp',
    version: '1.0.0',
    protocol: 'mcp-2024-11-05',
    tools: MCP_TOOLS,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, method, params } = body;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    if (method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: 'tangaly-shipping-mcp',
            version: '1.0.0',
          },
        },
      }, { headers: corsHeaders });
    }

    if (method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      }, { headers: corsHeaders });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'track_shipment') {
        const result = await publicTracking(args.trackingNumber || '');
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        }, { headers: corsHeaders });
      }

      if (toolName === 'get_rates_and_services') {
        const rates = [
          { mode: 'AIR', label: 'Fret Aérien Express', delai: '48h à 72h', rate: '$12/kg' },
          { mode: 'SEA', label: 'Fret Maritime Sécurisé', delai: '30 à 45 jours', rate: 'Par volume ou conteneur' },
        ];
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(rates, null, 2),
              },
            ],
          },
        }, { headers: corsHeaders });
      }

      if (toolName === 'get_agencies') {
        const agencies = [
          { agency: 'New York (Bronx)', address: '3429 3rd Ave, Bronx, NY 10456', tel: '+1-646-382-0065' },
          { agency: 'New York (Brooklyn)', address: '28 Arlington Ave, Brooklyn, NY 11207', tel: '+1-646-382-0065' },
          { agency: 'Conakry (Guinée)', address: 'Cité Enco 5, Conakry', tel: '+224-626-98-52-54' },
        ];
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(agencies, null, 2),
              },
            ],
          },
        }, { headers: corsHeaders });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Tool not found: ${toolName}` },
      }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    }, { status: 404, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: err.message || 'Internal error' },
    }, { status: 500 });
  }
}

