'use client';
import { useState, useEffect } from 'react';
import { createShipment } from '@/actions/shipments';
import styles from '../operations.module.css';
import { PlusSquare, Save, Package, User, MapPin, CheckCircle, Printer, X, Plus, Trash2, DollarSign, Layers, AlertCircle, Plane, Ship, ArrowRight, Box, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createOperationShipment } from '@/actions/shipments';

// ── Types & Catégories de produits avec tarifs par défaut ──
interface ProductCategory {
  label: string;
  defaultAirRate: number;
  defaultSeaRate: number;
  hint: string;
}

const PRODUCT_CATEGORIES: Record<string, ProductCategory> = {
  'Vêtements & Textiles': {
    label: 'Vêtements & Textiles',
    defaultAirRate: 12,
    defaultSeaRate: 5,
    hint: 'Pantalons, robes, pagnes, habits...',
  },
  'Chaussures': {
    label: 'Chaussures',
    defaultAirRate: 13,
    defaultSeaRate: 6,
    hint: 'Baskets, sandales, mocassins...',
  },
  'Fruits & Denrées': {
    label: 'Fruits & Denrées alimentaires',
    defaultAirRate: 15,
    defaultSeaRate: 7,
    hint: 'Mangues séchées, condiments, céréales...',
  },
  'Liquides & Huiles': {
    label: 'Liquides & Huiles',
    defaultAirRate: 18,
    defaultSeaRate: 9,
    hint: 'Huile de palme, jus, lotions...',
  },
  'Médicaments traditionnels': {
    label: 'Médicaments traditionnels',
    defaultAirRate: 20,
    defaultSeaRate: 10,
    hint: 'Tisanes, racines, écorces, remèdes traditionnels...',
  },
  'Médicaments pharmaceutiques': {
    label: 'Médicaments pharmaceutiques',
    defaultAirRate: 22,
    defaultSeaRate: 11,
    hint: 'Comprimés, gélules, sirops, boîtes pharmaceutiques...',
  },
  'Cosmétiques & Beauté': {
    label: 'Cosmétiques & Beauté',
    defaultAirRate: 15,
    defaultSeaRate: 7,
    hint: 'Crèmes, beurres de karité, savons...',
  },
  'Électronique': {
    label: 'Électronique & Appareils',
    defaultAirRate: 22,
    defaultSeaRate: 12,
    hint: 'Téléphones, tablettes, petits appareils...',
  },
  'Autre marchandise': {
    label: 'Autre marchandise',
    defaultAirRate: 12,
    defaultSeaRate: 5,
    hint: 'Divers articles...',
  },
};

export interface ProductItem {
  id: string;
  category: string;
  description: string;
  boxes: number;
  weight: number | '';
  ratePerKg: number;
}

export default function NewShipmentPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = user?.role || '';
  const userLocation = (user?.localisation || '').toLowerCase();

  const isUSAAgent = userLocation.includes('york') || userLocation.includes('usa') || userRole === 'GERANT_USA' || userRole === 'AGENT_USA';

  const [direction, setDirection] = useState<'GN_USA' | 'USA_GN'>(() => {
    return isUSAAgent ? 'USA_GN' : 'GN_USA';
  });
  const [transportType, setTransportType] = useState<'AERIEN' | 'MARITIME'>('AERIEN');

  useEffect(() => {
    if (isUSAAgent) {
      setDirection('USA_GN');
    } else if (userLocation.includes('guinee') || userLocation.includes('conakry') || userRole === 'GERANT_GUINEE' || userRole === 'AGENT_GUINEE') {
      setDirection('GN_USA');
    }

    // Récupérer une estimation transférée depuis le calculateur
    try {
      const savedQuote = sessionStorage.getItem('tangaly_quote_to_shipment');
      if (savedQuote) {
        const data = JSON.parse(savedQuote);
        if (data.direction) setDirection(data.direction);
        if (data.transportType) setTransportType(data.transportType);
        if (data.packagingMode) setPackagingMode(data.packagingMode);
        if (data.containerType) setContainerType(data.containerType);
        if (data.physicalBoxesCount) setPhysicalBoxesCount(data.physicalBoxesCount);
        if (data.productLines && Array.isArray(data.productLines) && data.productLines.length > 0) {
          setProductLines(data.productLines);
        }
        sessionStorage.removeItem('tangaly_quote_to_shipment');
      }
    } catch (e) {
      console.error('Erreur chargement devis:', e);
    }
  }, [userRole, userLocation, isUSAAgent]);

  // Expéditeur
  const [senderPhone, setSenderPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [isKnownClient, setIsKnownClient] = useState(false);

  // Destinataire
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [isKnownReceiver, setIsKnownReceiver] = useState(false);

  // Conditionnement : Même carton (colis mixte) ou cartons séparés
  const [packagingMode, setPackagingMode] = useState<'SAME_BOX' | 'SEPARATE_BOXES'>('SAME_BOX');
  const [containerType, setContainerType] = useState('Carton');
  const [physicalBoxesCount, setPhysicalBoxesCount] = useState<number>(1);

  // Articles multi-produits
  const [productLines, setProductLines] = useState<ProductItem[]>([
    {
      id: '1',
      category: 'Vêtements & Textiles',
      description: '',
      boxes: 1,
      weight: '',
      ratePerKg: 12,
    },
  ]);

  // Paiement
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Modal de reçu
  const [showReceipt, setShowReceipt] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carnet d'adresses démo / local
  const knownClients: Record<string, string> = {
    '620123456': 'Mamadou Diallo',
    '621987654': 'Fatoumata Camara',
  };

  const knownReceivers: Record<string, { name: string; address: string }> = {
    '12125550198': { name: 'Ousmane Sylla', address: '456 Bronx Blvd, New York, NY' },
  };

  const senderPrefix = direction === 'USA_GN' ? '+1' : '+224';
  const receiverPrefix = direction === 'USA_GN' ? '+224' : '+1';

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/[^0-9]/g, '');
    const pfxDigits = senderPrefix.replace('+', '');
    if (digits.startsWith(pfxDigits) && digits.length > pfxDigits.length + 5) {
      digits = digits.substring(pfxDigits.length);
    }
    setSenderPhone(digits);
    if (knownClients[digits]) {
      setSenderName(knownClients[digits]);
      setIsKnownClient(true);
    } else {
      setIsKnownClient(false);
    }
  };

  const handleReceiverPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/[^0-9]/g, '');
    const pfxDigits = receiverPrefix.replace('+', '');
    if (digits.startsWith(pfxDigits) && digits.length > pfxDigits.length + 5) {
      digits = digits.substring(pfxDigits.length);
    }
    setReceiverPhone(digits);
    if (knownReceivers[digits]) {
      setReceiverName(knownReceivers[digits].name);
      setReceiverAddress(knownReceivers[digits].address);
      setIsKnownReceiver(true);
    } else {
      setIsKnownReceiver(false);
    }
  };

  // Helper pour obtenir le tarif suggéré selon le mode de transport
  const getCategoryDefaultRate = (category: string, type: 'AERIEN' | 'MARITIME') => {
    const cat = PRODUCT_CATEGORIES[category] || PRODUCT_CATEGORIES['Autre marchandise'];
    return type === 'AERIEN' ? cat.defaultAirRate : cat.defaultSeaRate;
  };

  // Changer le mode de transport et recalculer les tarifs par défaut
  const handleTransportTypeChange = (newType: 'AERIEN' | 'MARITIME') => {
    setTransportType(newType);
    setProductLines(prev =>
      prev.map(line => ({
        ...line,
        ratePerKg: getCategoryDefaultRate(line.category, newType),
      }))
    );
  };

  // Gestion des lignes de produits
  const addProductLine = () => {
    const defaultCat = 'Fruits & Denrées';
    const rate = getCategoryDefaultRate(defaultCat, transportType);
    setProductLines(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        category: defaultCat,
        description: '',
        boxes: 1,
        weight: '',
        ratePerKg: rate,
      },
    ]);
  };

  const removeProductLine = (id: string) => {
    if (productLines.length <= 1) return;
    setProductLines(prev => prev.filter(p => p.id !== id));
  };

  const updateProductLine = (id: string, field: keyof ProductItem, value: any) => {
    setProductLines(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'category') {
          updated.ratePerKg = getCategoryDefaultRate(value, transportType);
        }
        return updated;
      })
    );
  };

  // Calculs totaux
  const totalBoxes =
    packagingMode === 'SAME_BOX'
      ? Number(physicalBoxesCount) || 1
      : productLines.reduce((acc, curr) => acc + (Number(curr.boxes) || 0), 0);
  const totalWeight = productLines.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
  const freightCost = productLines.reduce((acc, curr) => {
    const w = Number(curr.weight) || 0;
    const r = Number(curr.ratePerKg) || 0;
    return acc + w * r;
  }, 0);

  const docFee = 0; // Frais de dossier supprimés
  const total = freightCost;
  const paid = amountPaid === '' ? total : Number(amountPaid);
  const balance = total - paid;
  const today = new Date().toLocaleDateString('fr-FR');

  const handleSave = async () => {
    if (!senderName || !receiverName) {
      setError('Veuillez renseigner au minimum le nom de l’expéditeur et du destinataire.');
      return;
    }
    if (totalWeight <= 0) {
      setError('Veuillez saisir un poids supérieur à 0 pour au moins un produit.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Générer une description structurée et lisible
      const formattedDescription =
        packagingMode === 'SAME_BOX'
          ? `[${physicalBoxesCount} ${containerType}${physicalBoxesCount > 1 ? 's' : ''} (Contenu mixte) : ` +
            productLines
              .map(
                p =>
                  `${p.category}${p.description ? ` (${p.description})` : ''} (${p.weight} kg @ $${p.ratePerKg}/kg = $${((Number(p.weight) || 0) * Number(p.ratePerKg)).toFixed(2)})`
              )
              .join(', ') +
            ']'
          : productLines
              .map(
                p =>
                  `${p.category}${p.description ? ` (${p.description})` : ''} [${p.boxes} colis, ${p.weight} kg @ $${p.ratePerKg}/kg = $${((Number(p.weight) || 0) * Number(p.ratePerKg)).toFixed(2)}]`
              )
              .join(' | ');

      const fullSenderPhone = senderPhone.trim().startsWith('+')
        ? senderPhone.trim()
        : `${senderPrefix} ${senderPhone.trim()}`;

      const fullReceiverPhone = receiverPhone.trim().startsWith('+')
        ? receiverPhone.trim()
        : `${receiverPrefix} ${receiverPhone.trim()}`;

      const res = await createOperationShipment({
        origine: direction === 'GN_USA' ? 'Conakry' : 'New York',
        destination: direction === 'GN_USA' ? 'New York' : 'Conakry',
        type_transport: transportType,
        senderName,
        senderPhone: fullSenderPhone,
        senderAddress,
        receiverName,
        receiverPhone: fullReceiverPhone,
        receiverAddress,
        description: formattedDescription,
        boxes: totalBoxes,
        poids: Number(totalWeight.toFixed(2)),
        amountPaid: amountPaid === '' ? total : Number(amountPaid),
        paymentMethod,
        freightCost,
        docFee: 0,
        totalAmount: total,
        balance,
      });

      if (!res.success) throw new Error(res.message || 'Erreur lors de la création');

      setTrackingNumber(res.data?.tracking_number || '');
      setShowReceipt(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setSenderPhone('');
    setSenderName('');
    setSenderAddress('');
    setIsKnownClient(false);
    setReceiverPhone('');
    setReceiverName('');
    setReceiverAddress('');
    setIsKnownReceiver(false);
    setPackagingMode('SAME_BOX');
    setContainerType('Carton');
    setPhysicalBoxesCount(1);
    setProductLines([
      {
        id: Date.now().toString(),
        category: 'Vêtements & Textiles',
        description: '',
        boxes: 1,
        weight: '',
        ratePerKg: getCategoryDefaultRate('Vêtements & Textiles', transportType),
      },
    ]);
    setAmountPaid('');
    setShowReceipt(false);
    setError(null);
  };

  const printLabel = () => {
    const printWindow = window.open('', '', 'width=400,height=400');
    if (printWindow) {
      const containerLabel = packagingMode === 'SAME_BOX' ? `${totalBoxes} ${containerType}${totalBoxes > 1 ? 's' : ''} (Contenu mixte)` : `${totalBoxes} Colis`;
      printWindow.document.write(`
        <html>
          <head>
            <title>Étiquette QR</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; color: black; background: white; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
              .box { border: 4px solid black; padding: 20px; border-radius: 10px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .track { font-size: 28px; font-weight: 900; margin-top: 10px; }
              .info { font-size: 14px; margin-top: 8px; color: #333; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="title">TANGALY LOGISTICS</div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${trackingNumber}" alt="QR Code" style="width: 180px; height: 180px;" />
              <div class="track">N° ${trackingNumber}</div>
              <div class="info">${containerLabel} · ${totalWeight.toFixed(1)} kg · ${transportType}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const printReceipt = () => {
    const printContent = document.getElementById('printable-receipt');
    if (printContent) {
      const printWindow = window.open('', '', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reçu Tangaly — ${trackingNumber}</title>
              <style>
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  box-sizing: border-box;
                  margin: 0;
                  padding: 0;
                }
                @page {
                  size: A4 portrait;
                  margin: 10mm 12mm;
                }
                body {
                  font-family: Arial, sans-serif;
                  color: #111;
                  background: white;
                  font-size: 11px;
                }
                table { border-collapse: collapse; width: 100%; }
                th, td { padding: 5px 8px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Formulaire visible */}
      <div className="no-print">
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Nouvelle Expédition Multi-Produits</h2>
            <p className={styles.cardSubtitle}>
              Facturation précise avec tarification par catégorie (liquides, fruits, chaussures, médicaments traditionnels ou pharmaceutiques...).
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className={styles.chartCard}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Trajet automatique selon le pays de l'agent */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 18px',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 10,
              width: 'fit-content',
              fontSize: 14,
              fontWeight: 700,
              color: '#1e293b',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <span style={{ 
                background: direction === 'USA_GN' ? '#eff6ff' : '#f0fdf4', 
                color: direction === 'USA_GN' ? '#1d4ed8' : '#15803d', 
                border: `1px solid ${direction === 'USA_GN' ? '#93c5fd' : '#86efac'}`, 
                borderRadius: 6, 
                padding: '3px 8px', 
                fontSize: 12, 
                fontWeight: 800 
              }}>
                {direction === 'USA_GN' ? 'USA' : 'GN'}
              </span>
              <span>{direction === 'USA_GN' ? 'États-Unis (New York)' : 'Guinée (Conakry)'}</span>
              <ArrowRight size={16} color="#64748b" />
              <span style={{ 
                background: direction === 'USA_GN' ? '#f0fdf4' : '#eff6ff', 
                color: direction === 'USA_GN' ? '#15803d' : '#1d4ed8', 
                border: `1px solid ${direction === 'USA_GN' ? '#86efac' : '#93c5fd'}`, 
                borderRadius: 6, 
                padding: '3px 8px', 
                fontSize: 12, 
                fontWeight: 800 
              }}>
                {direction === 'USA_GN' ? 'GN' : 'USA'}
              </span>
              <span>{direction === 'USA_GN' ? 'Guinée (Conakry)' : 'États-Unis (New York)'}</span>
            </div>

            {/* Expéditeur & Destinataire */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Expéditeur */}
              <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, marginBottom: 20, color: '#0f172a' }}>
                  <User size={18} color="#2563eb" /> Informations de l&apos;Expéditeur {direction === 'USA_GN' ? '(États-Unis)' : '(Guinée)'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                      Téléphone {senderPrefix === '+1' ? '(États-Unis : +1)' : '(Guinée : +224)'} *
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '10px 12px',
                          background: '#f8fafc',
                          border: isKnownClient ? '2px solid #10b981' : '1px solid #cbd5e1',
                          borderRight: 'none',
                          borderTopLeftRadius: '8px',
                          borderBottomLeftRadius: '8px',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#1e293b',
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span
                          style={{
                            background: senderPrefix === '+1' ? '#eff6ff' : '#f0fdf4',
                            color: senderPrefix === '+1' ? '#1d4ed8' : '#15803d',
                            border: `1px solid ${senderPrefix === '+1' ? '#93c5fd' : '#86efac'}`,
                            borderRadius: 4,
                            padding: '1px 5px',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {senderPrefix === '+1' ? 'US' : 'GN'}
                        </span>
                        <span>{senderPrefix}</span>
                      </span>
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={handlePhoneChange}
                        placeholder={senderPrefix === '+1' ? '646 382 0065' : '620 12 34 56'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: isKnownClient ? '2px solid #10b981' : '1px solid #cbd5e1',
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          borderTopRightRadius: '8px',
                          borderBottomRightRadius: '8px',
                          fontSize: 14,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {isKnownClient && <CheckCircle size={18} color="#10b981" style={{ position: 'absolute', right: 10, top: 10 }} />}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>Nom Complet *</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                      placeholder="Nom complet"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: isKnownClient ? '1px solid #10b981' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: 14,
                        background: isKnownClient ? '#ecfdf5' : 'white',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                      {direction === 'USA_GN' ? 'Adresse aux USA (Rue, Ville, État)' : 'Adresse en Guinée (Ville, Quartier)'}
                    </label>
                    <input
                      type="text"
                      value={senderAddress}
                      onChange={e => setSenderAddress(e.target.value)}
                      placeholder={direction === 'USA_GN' ? 'ex: 3429 3rd Ave, Bronx, NY 10456' : 'ex: Madina, Conakry...'}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Destinataire */}
              <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, marginBottom: 20, color: '#0f172a' }}>
                  <MapPin size={18} color="#dc2626" /> Informations du Destinataire {direction === 'USA_GN' ? '(Guinée)' : '(États-Unis)'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                      Téléphone {receiverPrefix === '+1' ? '(États-Unis : +1)' : '(Guinée : +224)'} *
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '10px 12px',
                          background: '#f8fafc',
                          border: isKnownReceiver ? '2px solid #10b981' : '1px solid #cbd5e1',
                          borderRight: 'none',
                          borderTopLeftRadius: '8px',
                          borderBottomLeftRadius: '8px',
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#1e293b',
                          userSelect: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span
                          style={{
                            background: receiverPrefix === '+1' ? '#eff6ff' : '#f0fdf4',
                            color: receiverPrefix === '+1' ? '#1d4ed8' : '#15803d',
                            border: `1px solid ${receiverPrefix === '+1' ? '#93c5fd' : '#86efac'}`,
                            borderRadius: 4,
                            padding: '1px 5px',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {receiverPrefix === '+1' ? 'US' : 'GN'}
                        </span>
                        <span>{receiverPrefix}</span>
                      </span>
                      <input
                        type="tel"
                        value={receiverPhone}
                        onChange={handleReceiverPhoneChange}
                        placeholder={receiverPrefix === '+1' ? '646 382 0065' : '620 12 34 56'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: isKnownReceiver ? '2px solid #10b981' : '1px solid #cbd5e1',
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          borderTopRightRadius: '8px',
                          borderBottomRightRadius: '8px',
                          fontSize: 14,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {isKnownReceiver && <CheckCircle size={18} color="#10b981" style={{ position: 'absolute', right: 10, top: 10 }} />}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>Nom Complet *</label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={e => setReceiverName(e.target.value)}
                      placeholder="Nom complet"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: isKnownReceiver ? '1px solid #10b981' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: 14,
                        background: isKnownReceiver ? '#ecfdf5' : 'white',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
                      {direction === 'USA_GN' ? 'Adresse de livraison en Guinée (Ville, Quartier) *' : 'Adresse aux USA (Rue, Ville, État) *'}
                    </label>
                    <input
                      type="text"
                      value={receiverAddress}
                      onChange={e => setReceiverAddress(e.target.value)}
                      placeholder={direction === 'USA_GN' ? 'ex: Madina, Conakry ou Labé...' : 'ex: Bronx, NY ou Brooklyn, NY...'}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: isKnownReceiver ? '1px solid #10b981' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: 14,
                        background: isKnownReceiver ? '#ecfdf5' : 'white',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Détails Multi-Produits */}
            <div style={{ padding: '22px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, margin: 0, color: '#0f172a' }}>
                    <Package size={20} color="#2563eb" /> Articles &amp; Tarifs Multi-Produits
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                    Chaque type de produit (liquide, fruit, médicament traditionnel, médicament pharmaceutique, chaussure...) dispose de son tarif au kg.
                  </p>
                </div>

                {/* Sélecteur Mode de Transport */}
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleTransportTypeChange('AERIEN')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      background: transportType === 'AERIEN' ? '#2563eb' : 'transparent',
                      color: transportType === 'AERIEN' ? 'white' : '#475569',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Plane size={15} /> Fret Aérien (Rapide)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTransportTypeChange('MARITIME')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      background: transportType === 'MARITIME' ? '#0284c7' : 'transparent',
                      color: transportType === 'MARITIME' ? 'white' : '#475569',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ship size={15} /> Fret Maritime (Éco)
                  </button>
                </div>
              </div>

              {/* Sélecteur de Conditionnement (Même carton ou Cartons séparés) */}
              <div
                style={{
                  background: packagingMode === 'SAME_BOX' ? '#f0fdf4' : '#f8fafc',
                  border: packagingMode === 'SAME_BOX' ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: packagingMode === 'SAME_BOX' ? '#dcfce7' : '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Package size={22} color={packagingMode === 'SAME_BOX' ? '#15803d' : '#2563eb'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      Conditionnement Physique
                      {packagingMode === 'SAME_BOX' && (
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                          Colis Unique / Mixte
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Les différents articles sont-ils emballés dans le <strong>même carton</strong> ou dans des <strong>cartons séparés</strong> ?
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', background: 'white', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <button
                      type="button"
                      onClick={() => setPackagingMode('SAME_BOX')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: packagingMode === 'SAME_BOX' ? '#16a34a' : 'transparent',
                        color: packagingMode === 'SAME_BOX' ? 'white' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s',
                      }}
                    >
                      <Check size={14} /> Dans le même carton
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackagingMode('SEPARATE_BOXES')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: packagingMode === 'SEPARATE_BOXES' ? '#2563eb' : 'transparent',
                        color: packagingMode === 'SEPARATE_BOXES' ? 'white' : '#475569',
                        transition: 'all 0.15s',
                      }}
                    >
                      Cartons séparés
                    </button>
                  </div>

                  {packagingMode === 'SAME_BOX' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'white',
                        padding: '5px 12px',
                        borderRadius: 8,
                        border: '1px solid #86efac',
                      }}
                    >
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Type :</label>
                      <select
                        value={containerType}
                        onChange={e => setContainerType(e.target.value)}
                        style={{
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#0f172a',
                          outline: 'none',
                          cursor: 'pointer',
                          background: 'transparent',
                        }}
                      >
                        <option value="Carton">Carton</option>
                        <option value="Baril">Baril</option>
                        <option value="Valise">Valise</option>
                        <option value="Malle">Malle</option>
                        <option value="Sac">Sac</option>
                        <option value="Colis">Colis</option>
                      </select>

                      <span style={{ color: '#cbd5e1' }}>|</span>

                      <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Nombre :</label>
                      <input
                        type="number"
                        min="1"
                        value={physicalBoxesCount}
                        onChange={e => setPhysicalBoxesCount(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{
                          width: '45px',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#0f172a',
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#64748b' }}>physique(s)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Liste des lignes de produits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                {productLines.map((line, index) => {
                  const lineTotal = (Number(line.weight) || 0) * (Number(line.ratePerKg) || 0);
                  const catInfo = PRODUCT_CATEGORIES[line.category] || PRODUCT_CATEGORIES['Autre marchandise'];

                  return (
                    <div
                      key={line.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px',
                        background: '#f8fafc',
                        position: 'relative',
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            style={{
                              background: '#2563eb',
                              color: 'white',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                            }}
                          >
                            {index + 1}
                          </span>
                          Article / Produit
                        </span>

                        {productLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProductLine(line.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              padding: '4px 8px',
                              borderRadius: 6,
                            }}
                            title="Supprimer cette ligne"
                          >
                            <Trash2 size={15} /> Supprimer
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: 12,
                          alignItems: 'flex-start',
                        }}
                      >
                        {/* 1. Catégorie */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                            Catégorie de produit *
                          </label>
                          <select
                            value={line.category}
                            onChange={e => updateProductLine(line.id, 'category', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              fontSize: 14,
                              background: 'white',
                              fontWeight: 500,
                              color: '#0f172a',
                              outline: 'none',
                              cursor: 'pointer',
                              boxSizing: 'border-box',
                            }}
                          >
                            {Object.keys(PRODUCT_CATEGORIES).map(catKey => (
                              <option key={catKey} value={catKey}>
                                {PRODUCT_CATEGORIES[catKey].label} (${getCategoryDefaultRate(catKey, transportType)}/kg)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Détail / Précision */}
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                            Description / Détails
                          </label>
                          <input
                            type="text"
                            value={line.description}
                            onChange={e => updateProductLine(line.id, 'description', e.target.value)}
                            placeholder={catInfo.hint}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              fontSize: 14,
                              outline: 'none',
                              background: 'white',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* 3. Colis (Cartons) */}
                        {packagingMode === 'SAME_BOX' ? (
                          <div style={{ maxWidth: 140 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                              Contenant
                            </label>
                            <div
                              style={{
                                padding: '10px 12px',
                                background: '#ecfdf5',
                                border: '1px dashed #86efac',
                                borderRadius: '8px',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#15803d',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <Package size={13} /> Dans {containerType}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ maxWidth: 130 }}>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                              Colis (Cartons)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={line.boxes}
                              onChange={e => updateProductLine(line.id, 'boxes', Math.max(1, parseInt(e.target.value) || 1))}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                fontSize: 14,
                                outline: 'none',
                                background: 'white',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        )}

                        {/* 4. Poids (kg) */}
                        <div style={{ maxWidth: 140 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                            Poids (kg) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={line.weight}
                            onChange={e => updateProductLine(line.id, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                            placeholder="ex: 12.5"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              fontSize: 14,
                              outline: 'none',
                              background: 'white',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* 5. Tarif / kg (modifiable) */}
                        <div style={{ maxWidth: 140 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                            Tarif ($/kg)
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={line.ratePerKg}
                              onChange={e => updateProductLine(line.id, 'ratePerKg', parseFloat(e.target.value) || 0)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                fontSize: 14,
                                outline: 'none',
                                background: 'white',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>

                        {/* 6. Sous-total ligne */}
                        <div style={{ minWidth: 120 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5 }}>
                            Sous-total
                          </label>
                          <div
                            style={{
                              padding: '10px 12px',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderRadius: '8px',
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#1d4ed8',
                              textAlign: 'right',
                            }}
                          >
                            ${lineTotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton Ajouter un produit */}
              <button
                type="button"
                onClick={addProductLine}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 18px',
                  background: '#f1f5f9',
                  border: '1px dashed #94a3b8',
                  borderRadius: '8px',
                  color: '#1e293b',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '20px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#e2e8f0';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
              >
                <Plus size={18} color="#2563eb" /> Ajouter un autre produit (médicaments, liquides, fruits, chaussures...)
              </button>

              {/* Barre de récapitulatif & Finances */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 20,
                  borderTop: '2px solid #e2e8f0',
                  paddingTop: 20,
                  alignItems: 'center',
                }}
              >
                {/* Récapitulatif colis & fret */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                    Récapitulatif Financier
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                    <span style={{ color: '#475569' }}>Total Colis Physiques :</span>
                    <strong style={{ color: '#0f172a' }}>
                      {totalBoxes} {packagingMode === 'SAME_BOX' ? `${containerType}${totalBoxes > 1 ? 's' : ''} (Mixte)` : 'carton(s)'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                    <span style={{ color: '#475569' }}>Poids Total Cumulé :</span>
                    <strong>{totalWeight.toFixed(1)} kg</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                    <span style={{ color: '#475569' }}>Frais d'expédition (Fret) :</span>
                    <strong style={{ color: '#0f172a' }}>${freightCost.toFixed(2)}</strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '2px solid #e2e8f0',
                      paddingTop: 8,
                      marginTop: 6,
                    }}
                  >
                    <strong style={{ fontSize: 16, color: '#0f172a' }}>Montant Total :</strong>
                    <strong style={{ fontSize: 20, color: '#2563eb' }}>${total.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Encaissement */}
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                    Montant Avancé &amp; Mode de Paiement
                  </label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <input
                      type="number"
                      min="0"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder={`Total: $${total.toFixed(2)}`}
                      style={{
                        flex: '1 1 120px',
                        padding: '12px 16px',
                        border: '2px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: 16,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      style={{
                        flex: '1 1 140px',
                        padding: '12px 16px',
                        border: '2px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: 14,
                        background: 'white',
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="CASH">Espèces (Cash)</option>
                      <option value="ZELLE">Zelle</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>

                  {balance > 0 && (
                    <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                      Reste à payer : ${balance.toFixed(2)}
                    </div>
                  )}
                  {balance <= 0 && amountPaid !== '' && (
                    <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                      Payé en intégralité ✓
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleResetForm}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Réinitialiser
              </button>
              <button type="button" onClick={handleSave} className={styles.primaryButton} disabled={isLoading}>
                {isLoading ? (
                  'Enregistrement...'
                ) : (
                  <>
                    <Printer size={18} /> Enregistrer &amp; Imprimer le Reçu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL WEB APRES ENREGISTREMENT */}
      {showReceipt && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'white',
              width: '540px',
              maxWidth: '92vw',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              position: 'relative',
              boxSizing: 'border-box',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => setShowReceipt(false)}
              style={{ position: 'absolute', right: 16, top: 16, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} color="#64748b" />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: '#dcfce7',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <CheckCircle size={32} color="#16a34a" />
              </div>
              <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Expédition Enregistrée !</h2>
              <div
                style={{
                  display: 'inline-block',
                  margin: '10px 0',
                  padding: '6px 14px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 16,
                  color: '#1d4ed8',
                }}
              >
                N° {trackingNumber}
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                {productLines.length} article(s) · {totalWeight.toFixed(1)} kg · Montant : ${total.toFixed(2)}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <button
                onClick={printReceipt}
                style={{
                  padding: '14px',
                  background: '#1d4ed8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Printer size={18} /> Imprimer Reçu Officiel (A4 Multi-Produits)
              </button>

              <button
                onClick={printLabel}
                style={{
                  padding: '12px',
                  background: '#0f172a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Package size={18} /> Imprimer Étiquette Colis (Sticker QR)
              </button>

              <button
                onClick={handleResetForm}
                style={{
                  padding: '10px',
                  background: 'transparent',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                + Créer une nouvelle expédition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
           REÇU OFFICIEL MULTI-PRODUITS — FORMAT A4 IMPRIMABLE
      ══════════════════════════════════════════════════ */}
      <div
        id="printable-receipt"
        className="print-only"
        style={{
          display: 'none',
          fontFamily: "'Arial', sans-serif",
          padding: '24px 28px',
          maxWidth: '780px',
          margin: '0 auto',
          color: '#111',
          fontSize: '11px',
          background: 'white',
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  background: '#1d4ed8',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: 'white', fontWeight: '900', fontSize: '15px', fontStyle: 'italic' }}>T</span>
              </div>
              <div>
                <div style={{ color: '#1d4ed8', fontWeight: '900', fontSize: '20px', fontStyle: 'italic', lineHeight: '1' }}>
                  TANGALY
                </div>
                <div style={{ color: '#dc2626', fontSize: '9px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  SHIPPING &amp; LOGISTICS
                </div>
              </div>
            </div>
            <div style={{ color: '#555', fontSize: '9px' }}>
              Fret aérien &amp; maritime USA ⇌ Guinée (Conakry) · Air &amp; Ocean Freight USA ⇌ Guinea
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '9px', letterSpacing: '1px', marginBottom: '4px' }}>
              REÇU D'EXPÉDITION · SHIPPING RECEIPT
            </div>
            <div style={{ border: '2px solid #dc2626', padding: '5px 16px', borderRadius: '4px', marginBottom: '6px' }}>
              <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '13px' }}>N° {trackingNumber}</span>
            </div>
            <div style={{ fontSize: '10px' }}>
              Date : <strong>{today}</strong> · Mode : <strong>{transportType === 'AERIEN' ? 'AÉRIEN (AIR)' : 'MARITIME (SEA)'}</strong>
            </div>
          </div>
        </div>

        {/* ── BANDEAU COULEURS GUINÉE ── */}
        <div style={{ display: 'flex', height: '5px', marginBottom: '12px', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ flex: 1, background: '#CE1126' }} />
          <div style={{ flex: 1, background: '#FCD116' }} />
          <div style={{ flex: 1, background: '#009460' }} />
        </div>

        {/* ── ADRESSES AGENCES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div style={{ border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 12px', background: '#eff6ff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ background: '#1d4ed8', color: 'white', fontWeight: 'bold', fontSize: '9px', padding: '2px 5px', borderRadius: '3px', letterSpacing: '0.5px' }}>USA</span>
              <span style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '10px' }}>Agence USA</span>
            </div>
            <div style={{ color: '#334155', lineHeight: '1.5', fontSize: '9px' }}>
              3429 3rd Ave, Bronx, NY 10456<br />
              28 Arlington Avenue, Brooklyn, NY 11207<br />
              <strong style={{ color: '#1d4ed8' }}>+1 (646) 382-0065</strong>
            </div>
          </div>

          <div style={{ border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', background: '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ background: '#15803d', color: 'white', fontWeight: 'bold', fontSize: '9px', padding: '2px 5px', borderRadius: '3px', letterSpacing: '0.5px' }}>GN</span>
              <span style={{ fontWeight: 'bold', color: '#15803d', fontSize: '10px' }}>Guinée (Conakry)</span>
            </div>
            <div style={{ color: '#334155', lineHeight: '1.5', fontSize: '9px' }}>
              Cité Enco 5 · <strong style={{ color: '#15803d' }}>+224 626 98 52 54</strong><br />
              Zelle : 347-819-6217 · Orange Money : 611-62-83-27
            </div>
          </div>
        </div>

        {/* ── EXPÉDITEUR / DESTINATAIRE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#1d4ed8', color: 'white', fontWeight: 'bold', fontSize: '9px', padding: '4px 10px', letterSpacing: '0.5px' }}>
              EXPÉDITEUR · SENDER
            </div>
            <div style={{ padding: '6px 10px' }}>
              {[
                ['Nom / Name', senderName, true],
                ['Tél. / Phone', senderPhone, true],
                ['Adresse / Address', senderAddress, false],
              ].map(([label, val, bold]) => (
                <div key={String(label)} style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px', gap: '6px' }}>
                  <span style={{ color: '#64748b', whiteSpace: 'nowrap', fontSize: '9px', minWidth: '75px' }}>{String(label)}</span>
                  <span style={{ fontWeight: bold ? 'bold' : 'normal', fontSize: '10px', borderBottom: '1px solid #e2e8f0', flex: 1 }}>
                    {String(val || '—')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#15803d', color: 'white', fontWeight: 'bold', fontSize: '9px', padding: '4px 10px', letterSpacing: '0.5px' }}>
              DESTINATAIRE · RECEIVER
            </div>
            <div style={{ padding: '6px 10px' }}>
              {[
                ['Nom / Name', receiverName, true],
                ['Tél. / Phone', receiverPhone, true],
                ['Ville / City', receiverAddress, false],
              ].map(([label, val, bold]) => (
                <div key={String(label)} style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px', gap: '6px' }}>
                  <span style={{ color: '#64748b', whiteSpace: 'nowrap', fontSize: '9px', minWidth: '75px' }}>{String(label)}</span>
                  <span style={{ fontWeight: bold ? 'bold' : 'normal', fontSize: '10px', borderBottom: '1px solid #e2e8f0', flex: 1 }}>
                    {String(val || '—')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABLEAU DÉTAILS MULTI-PRODUITS ── */}
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontWeight: 'bold',
              color: '#1d4ed8',
              fontSize: '10px',
              borderBottom: '2px solid #1d4ed8',
              paddingBottom: '3px',
              marginBottom: '0',
              letterSpacing: '0.5px',
            }}
          >
            DÉTAILS DES PRODUITS &amp; MARCHANDISES · ITEMS &amp; SHIPPING RATES
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '5px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  ARTICLE / MARCHANDISE
                </th>
                <th style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  CONTENANT / COLIS
                </th>
                <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  POIDS (KG)
                </th>
                <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  TARIF / KG
                </th>
                <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  SOUS-TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {productLines.map((line, idx) => {
                const lineTotal = (Number(line.weight) || 0) * (Number(line.ratePerKg) || 0);
                return (
                  <tr key={line.id} style={{ background: idx % 2 === 1 ? '#f8fafc' : 'white' }}>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #e2e8f0' }}>
                      <strong style={{ color: '#0f172a' }}>{line.category}</strong>
                      {line.description && <span style={{ color: '#64748b', fontSize: '9px', marginLeft: 6 }}>— {line.description}</span>}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                      {packagingMode === 'SAME_BOX' ? `${containerType} (Mixte)` : line.boxes}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                      {Number(line.weight || 0).toFixed(1)} kg
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>${line.ratePerKg}/kg</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                      ${lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                <td style={{ padding: '6px 8px', borderTop: '2px solid #cbd5e1', color: '#1d4ed8' }}>
                  TOTAL CUMULÉ ({productLines.length} article{productLines.length > 1 ? 's' : ''})
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderTop: '2px solid #cbd5e1' }}>
                  {totalBoxes} {packagingMode === 'SAME_BOX' ? `${containerType}${totalBoxes > 1 ? 's' : ''}` : 'carton(s)'}
                </td>
                <td style={{ padding: '6px 8px', textAlign: 'right', borderTop: '2px solid #cbd5e1' }}>{totalWeight.toFixed(1)} kg</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', borderTop: '2px solid #cbd5e1' }}>—</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', borderTop: '2px solid #cbd5e1', color: '#1d4ed8', fontSize: '11px' }}>
                  ${freightCost.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── MODE DE PAIEMENT & RÉCAPITULATIF FINANCIER ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '14px', alignItems: 'start' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px' }}>
            <div style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '9px', letterSpacing: '0.5px', marginBottom: '8px' }}>
              MODE DE PAIEMENT · PAYMENT METHOD
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '13px',
                    height: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '2px',
                    background: paymentMethod === 'CASH' ? '#1d4ed8' : 'white',
                    color: 'white',
                    fontSize: '9px',
                    flexShrink: 0,
                  }}
                >
                  {paymentMethod === 'CASH' ? '✓' : ''}
                </span>
                Espèces / Cash
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '13px',
                    height: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '2px',
                    background: paymentMethod === 'ZELLE' ? '#1d4ed8' : 'white',
                    color: 'white',
                    fontSize: '9px',
                    flexShrink: 0,
                  }}
                >
                  {paymentMethod === 'ZELLE' ? '✓' : ''}
                </span>
                Zelle
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '13px',
                    height: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '2px',
                    background: paymentMethod === 'ORANGE_MONEY' ? '#1d4ed8' : 'white',
                    color: 'white',
                    fontSize: '9px',
                    flexShrink: 0,
                  }}
                >
                  {paymentMethod === 'ORANGE_MONEY' ? '✓' : ''}
                </span>
                Orange Money
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '13px',
                    height: '13px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '2px',
                    background: paymentMethod === 'OTHER' ? '#1d4ed8' : 'white',
                    color: 'white',
                    fontSize: '9px',
                    flexShrink: 0,
                  }}
                >
                  {paymentMethod === 'OTHER' ? '✓' : ''}
                </span>
                Autre / Other
              </div>
            </div>
          </div>

          <div style={{ minWidth: '190px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px' }}>
              <span>Fret Total · Freight</span>
              <span style={{ fontWeight: 'bold' }}>${freightCost.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '4px',
                marginTop: '2px',
              }}
            >
              <span>Montant Total</span>
              <span style={{ color: '#1d4ed8' }}>${total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px' }}>
              <span>Payé · Paid</span>
              <span style={{ color: '#15803d', fontWeight: 'bold' }}>${paid.toFixed(2)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                background: balance > 0 ? '#dc2626' : '#15803d',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '4px',
                marginTop: '4px',
              }}
            >
              <span>{balance > 0 ? 'Reste à payer · Balance' : 'Soldé · Fully Paid'}</span>
              <span>${balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── SIGNATURES ── */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '14px', marginTop: '8px' }}>
          <div style={{ textAlign: 'center', width: '35%' }}>
            <div style={{ borderBottom: '1px solid #334155', marginBottom: '4px', height: '26px' }}></div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>Signature client · Customer</div>
          </div>
          <div style={{ textAlign: 'center', width: '35%' }}>
            <div style={{ borderBottom: '1px solid #334155', marginBottom: '4px', height: '26px' }}></div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>Cachet &amp; signature · Tangaly</div>
          </div>
        </div>

        {/* ── TERMES & CONDITIONS ── */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            fontSize: '9px',
            color: '#475569',
          }}
        >
          <div>
            <strong style={{ color: '#334155' }}>Terms &amp; Conditions</strong>
            <ul style={{ margin: '3px 0 0 0', paddingLeft: '12px', lineHeight: '1.6' }}>
              <li>Tangaly Shipping is not responsible for prohibited or illegal items.</li>
              <li>Tangaly Shipping is not liable for damage due to improper packaging.</li>
              <li>Estimated delivery time: 5–10 business days.</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: '#334155' }}>Termes et conditions</strong>
            <ul style={{ margin: '3px 0 0 0', paddingLeft: '12px', lineHeight: '1.6' }}>
              <li>Tangaly Shipping n'est pas responsable des articles interdits ou illégaux.</li>
              <li>Tangaly Shipping n'est pas responsable des dommages dus à un mauvais emballage.</li>
              <li>Délai de livraison estimé : 5–10 jours ouvrables.</li>
            </ul>
          </div>
        </div>

        {/* ── PIED DE PAGE ── */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '9px',
            color: '#64748b',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '6px',
          }}
        >
          <strong style={{ color: '#1d4ed8' }}>Tangaly Shipping &amp; Logistics</strong> · Rapide, fiable et sécurisé · Fast, reliable &amp; secure<br />
          Merci de votre confiance · Thank you for your trust
        </div>
      </div>
    </div>
  );
}
