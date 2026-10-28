'use client';
import { useState, useEffect } from 'react';
import { createShipment } from '@/actions/shipments';
import styles from '../operations.module.css';
import { PlusSquare, Save, Package, User, MapPin, CheckCircle, Printer, X, Plus, Trash2, DollarSign, Layers, AlertCircle } from 'lucide-react';
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
  const userRole = (session?.user as any)?.role || '';

  const [direction, setDirection] = useState<'GN_USA' | 'USA_GN'>('GN_USA');
  const [transportType, setTransportType] = useState<'AERIEN' | 'MARITIME'>('AERIEN');

  useEffect(() => {
    if (userRole === 'GERANT_GUINEE' || userRole === 'AGENT_GUINEE') {
      setDirection('GN_USA');
    } else if (userRole === 'GERANT_USA') {
      setDirection('USA_GN');
    }
  }, [userRole]);

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/[^0-9]/g, '');
    setSenderPhone(phone);
    if (knownClients[phone]) {
      setSenderName(knownClients[phone]);
      setIsKnownClient(true);
    } else {
      setIsKnownClient(false);
    }
  };

  const handleReceiverPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/[^0-9]/g, '');
    setReceiverPhone(phone);
    if (knownReceivers[phone]) {
      setReceiverName(knownReceivers[phone].name);
      setReceiverAddress(knownReceivers[phone].address);
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
  const totalBoxes = productLines.reduce((acc, curr) => acc + (Number(curr.boxes) || 0), 0);
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
      const formattedDescription = productLines
        .map(
          p =>
            `${p.category}${p.description ? ` (${p.description})` : ''} [${p.boxes} colis, ${p.weight} kg @ $${p.ratePerKg}/kg = $${((Number(p.weight) || 0) * Number(p.ratePerKg)).toFixed(2)}]`
        )
        .join(' | ');

      const res = await createOperationShipment({
        origine: direction === 'GN_USA' ? 'Conakry' : 'New York',
        destination: direction === 'GN_USA' ? 'New York' : 'Conakry',
        type_transport: transportType,
        senderName,
        senderPhone,
        senderAddress,
        receiverName,
        receiverPhone,
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
      printWindow.document.write(`
        <html>
          <head>
            <title>Étiquette QR</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; color: black; background: white; margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
              .box { border: 4px solid black; padding: 20px; border-radius: 10px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .track { font-size: 28px; font-weight: 900; margin-top: 10px; }
              .info { font-size: 14px; margin-top: 8px; color: #333; }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="title">TANGALY LOGISTICS</div>
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${trackingNumber}" alt="QR Code" style="width: 180px; height: 180px;" />
              <div class="track">N° ${trackingNumber}</div>
              <div class="info">${totalBoxes} Colis · ${totalWeight.toFixed(1)} kg · ${transportType}</div>
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
            {/* Direction de l'expédition */}
            {(userRole === 'SUPER_ADMIN' || userRole === '') && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setDirection('GN_USA')}
                  style={{
                    flex: '1 1 200px',
                    minWidth: 160,
                    padding: '14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 15,
                    border: direction === 'GN_USA' ? '2px solid #2563eb' : '2px solid #e2e8f0',
                    background: direction === 'GN_USA' ? '#eff6ff' : 'white',
                    color: direction === 'GN_USA' ? '#2563eb' : '#64748b',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <svg width="28" height="18" viewBox="0 0 3 2" style={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                    <rect width="1" height="2" fill="#CE1126" />
                    <rect x="1" width="1" height="2" fill="#FCD116" />
                    <rect x="2" width="1" height="2" fill="#009460" />
                  </svg>
                  Guinée →
                  <svg width="28" height="18" viewBox="0 0 7 4" style={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                    <rect width="7" height="4" fill="#B22234" />
                    <rect y="0.5" width="7" height="0.4" fill="white" />
                    <rect y="1.5" width="7" height="0.4" fill="white" />
                    <rect y="2.5" width="7" height="0.4" fill="white" />
                    <rect y="3.1" width="7" height="0.4" fill="white" />
                    <rect width="3" height="2.2" fill="#3C3B6E" />
                  </svg>
                  USA
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('USA_GN')}
                  style={{
                    flex: '1 1 200px',
                    minWidth: 160,
                    padding: '14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 15,
                    border: direction === 'USA_GN' ? '2px solid #2563eb' : '2px solid #e2e8f0',
                    background: direction === 'USA_GN' ? '#eff6ff' : 'white',
                    color: direction === 'USA_GN' ? '#2563eb' : '#64748b',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <svg width="28" height="18" viewBox="0 0 7 4" style={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                    <rect width="7" height="4" fill="#B22234" />
                    <rect y="0.5" width="7" height="0.4" fill="white" />
                    <rect y="1.5" width="7" height="0.4" fill="white" />
                    <rect y="2.5" width="7" height="0.4" fill="white" />
                    <rect y="3.1" width="7" height="0.4" fill="white" />
                    <rect width="3" height="2.2" fill="#3C3B6E" />
                  </svg>
                  USA →
                  <svg width="28" height="18" viewBox="0 0 3 2" style={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                    <rect width="1" height="2" fill="#CE1126" />
                    <rect x="1" width="1" height="2" fill="#FCD116" />
                    <rect x="2" width="1" height="2" fill="#009460" />
                  </svg>
                  Guinée
                </button>
              </div>
            )}

            <div style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="#94a3b8" />
              {direction === 'GN_USA' ? 'Départ : Conakry — Arrivée : New York' : 'Départ : New York — Arrivée : Conakry'}
            </div>

            {/* Expéditeur & Destinataire */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Expéditeur */}
              <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, marginBottom: 20, color: '#0f172a' }}>
                  <User size={18} color="#2563eb" /> Informations de l'Expéditeur
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>Téléphone *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={handlePhoneChange}
                        placeholder="ex: 620..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: isKnownClient ? '2px solid #10b981' : '1px solid #cbd5e1',
                          borderRadius: '8px',
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
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>Adresse (Ville, Quartier)</label>
                    <input
                      type="text"
                      value={senderAddress}
                      onChange={e => setSenderAddress(e.target.value)}
                      placeholder="Adresse"
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
                  <MapPin size={18} color="#dc2626" /> Informations du Destinataire
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>Téléphone *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="tel"
                        value={receiverPhone}
                        onChange={handleReceiverPhoneChange}
                        placeholder="Numéro du destinataire"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: isKnownReceiver ? '2px solid #10b981' : '1px solid #cbd5e1',
                          borderRadius: '8px',
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
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#475569', marginBottom: 6 }}>Adresse (Ville / État) *</label>
                    <input
                      type="text"
                      value={receiverAddress}
                      onChange={e => setReceiverAddress(e.target.value)}
                      placeholder="ex: Bronx, NY ou Conakry"
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
                    }}
                  >
                    ✈️ Fret Aérien (Rapide)
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
                    }}
                  >
                    🚢 Fret Maritime (Éco)
                  </button>
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
                    <span style={{ color: '#475569' }}>Total Colis (Cartons) :</span>
                    <strong>{totalBoxes} carton(s)</strong>
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
              <img src="https://flagcdn.com/w40/us.png" alt="USA" style={{ width: '18px', height: '12px', objectFit: 'cover', borderRadius: '2px' }} />
              <span style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '10px' }}>USA</span>
            </div>
            <div style={{ color: '#334155', lineHeight: '1.5', fontSize: '9px' }}>
              3429 3rd Ave, Bronx, NY 10456<br />
              28 Arlington Avenue, Brooklyn, NY 11207<br />
              <strong style={{ color: '#1d4ed8' }}>+1 (646) 382-0065</strong>
            </div>
          </div>

          <div style={{ border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px 12px', background: '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <img src="https://flagcdn.com/w40/gn.png" alt="GN" style={{ width: '18px', height: '12px', objectFit: 'cover', borderRadius: '2px' }} />
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
                  COLIS
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
                    <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>{line.boxes}</td>
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
                <td style={{ padding: '6px 8px', textAlign: 'center', borderTop: '2px solid #cbd5e1' }}>{totalBoxes} carton(s)</td>
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
