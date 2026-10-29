'use client';

import { useState } from 'react';
import styles from '../operations.module.css';
import {
  Calculator,
  Plus,
  Trash2,
  Share2,
  Copy,
  ArrowRight,
  RotateCcw,
  Box,
  Package,
  Layers,
  Clock,
  Sparkles,
  Check,
  Plane,
  Ship,
  HelpCircle,
  AlertCircle,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Grille tarifaire synchronisée Tangaly ──
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
    hint: 'Tisanes, racines, écorces, remèdes...',
  },
  'Médicaments pharmaceutiques': {
    label: 'Médicaments pharmaceutiques',
    defaultAirRate: 22,
    defaultSeaRate: 11,
    hint: 'Comprimés, gélules, sirops, ordonnances...',
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
    hint: 'Marchandise diverse...',
  },
};

interface QuoteItem {
  id: string;
  category: string;
  description: string;
  boxes: number;
  weight: number | '';
  ratePerKg: number;
}

export default function CalculatorPage() {
  const router = useRouter();

  // Trajet & Transport
  const [direction, setDirection] = useState<'GN_USA' | 'USA_GN'>('GN_USA');
  const [transportType, setTransportType] = useState<'AERIEN' | 'MARITIME'>('AERIEN');

  // Taux de change configurable
  const [exchangeRate, setExchangeRate] = useState<number>(8650);
  const [isEditingRate, setIsEditingRate] = useState(false);

  // Conditionnement (Même carton ou Cartons séparés)
  const [packagingMode, setPackagingMode] = useState<'SAME_BOX' | 'SEPARATE_BOXES'>('SAME_BOX');
  const [containerType, setContainerType] = useState('Carton');
  const [physicalBoxesCount, setPhysicalBoxesCount] = useState<number>(1);

  // Articles multi-produits
  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: '1',
      category: 'Vêtements & Textiles',
      description: '',
      boxes: 1,
      weight: '',
      ratePerKg: 12,
    },
  ]);

  // Calculateur volumétrique (optionnel)
  const [showVolumetric, setShowVolumetric] = useState(false);
  const [dimLength, setDimLength] = useState<number | ''>('');
  const [dimWidth, setDimWidth] = useState<number | ''>('');
  const [dimHeight, setDimHeight] = useState<number | ''>('');

  // État de copie
  const [copied, setCopied] = useState(false);

  const getCategoryDefaultRate = (category: string, type: 'AERIEN' | 'MARITIME') => {
    const cat = PRODUCT_CATEGORIES[category] || PRODUCT_CATEGORIES['Autre marchandise'];
    return type === 'AERIEN' ? cat.defaultAirRate : cat.defaultSeaRate;
  };

  const handleTransportChange = (type: 'AERIEN' | 'MARITIME') => {
    setTransportType(type);
    setItems(prev =>
      prev.map(it => ({
        ...it,
        ratePerKg: getCategoryDefaultRate(it.category, type),
      }))
    );
  };

  const handleAddItem = () => {
    const defaultCat = 'Fruits & Denrées';
    setItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        category: defaultCat,
        description: '',
        boxes: 1,
        weight: '',
        ratePerKg: getCategoryDefaultRate(defaultCat, transportType),
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'category') {
          updated.ratePerKg = getCategoryDefaultRate(value, transportType);
        }
        return updated;
      })
    );
  };

  const handleReset = () => {
    setItems([
      {
        id: Date.now().toString(),
        category: 'Vêtements & Textiles',
        description: '',
        boxes: 1,
        weight: '',
        ratePerKg: getCategoryDefaultRate('Vêtements & Textiles', transportType),
      },
    ]);
    setDimLength('');
    setDimWidth('');
    setDimHeight('');
    setShowVolumetric(false);
  };

  // Calculs totaux
  const totalBoxes =
    packagingMode === 'SAME_BOX'
      ? Number(physicalBoxesCount) || 1
      : items.reduce((acc, it) => acc + (Number(it.boxes) || 0), 0);
  const totalWeight = items.reduce((acc, it) => acc + (Number(it.weight) || 0), 0);
  const totalUSD = items.reduce((acc, it) => {
    const w = Number(it.weight) || 0;
    const r = Number(it.ratePerKg) || 0;
    return acc + w * r;
  }, 0);
  const totalGNF = Math.round(totalUSD * exchangeRate);

  // Calcul volumétrique
  const volumetricWeight =
    dimLength && dimWidth && dimHeight
      ? Number(((Number(dimLength) * Number(dimWidth) * Number(dimHeight)) / 5000).toFixed(1))
      : 0;

  const isVolumetricHeavier = volumetricWeight > totalWeight && volumetricWeight > 0;

  // Appliquer le poids volumétrique à la première ligne
  const handleApplyVolumetricWeight = () => {
    if (volumetricWeight > 0 && items.length > 0) {
      handleUpdateItem(items[0].id, 'weight', volumetricWeight);
    }
  };

  // Texte pour WhatsApp & Presse-papiers
  const generateQuoteText = () => {
    const linesSummary = items
      .map(it => {
        const cost = (Number(it.weight) || 0) * (Number(it.ratePerKg) || 0);
        return `• ${it.category}${it.description ? ` (${it.description})` : ''} : ${it.weight || 0} kg @ $${it.ratePerKg}/kg = $${cost.toFixed(2)}`;
      })
      .join('\n');

    const packagingInfo =
      packagingMode === 'SAME_BOX'
        ? `📦 *Conditionnement* : ${totalBoxes} ${containerType}${totalBoxes > 1 ? 's' : ''} physique(s) (Contenu groupé/mixte)`
        : `📦 *Conditionnement* : ${totalBoxes} carton(s) séparé(s)`;

    return `📦 *ESTIMATION DE PRIX — TANGALY LOGISTICS*
📍 *Trajet* : ${direction === 'GN_USA' ? 'Guinée (Conakry) ➔ USA (New York)' : 'USA (New York) ➔ Guinée (Conakry)'}
🚀 *Mode* : ${transportType === 'AERIEN' ? '✈️ Fret Aérien (Délai : 5 à 10 jours)' : '🚢 Fret Maritime (Délai : 30 à 45 jours)'}
${packagingInfo}
----------------------------------------
${linesSummary}
----------------------------------------
⚖️ *Total* : ${totalBoxes} ${packagingMode === 'SAME_BOX' ? `${containerType}${totalBoxes > 1 ? 's' : ''}` : 'carton(s)'} | *Poids cumulé* : ${totalWeight.toFixed(1)} kg
💰 *TOTAL ESTIMÉ* : *$${totalUSD.toFixed(2)} USD*
🇬🇳 *Équivalent GNF* : *~${totalGNF.toLocaleString()} GNF* (Taux : 1$ = ${exchangeRate.toLocaleString()} GNF)
❌ *Frais de dossier* : 0 $ (Aucun frais supplémentaire)

📞 *Contact Tangaly Shipping* :
• Bureau Conakry : +224 626 98 52 54 (Cité Enco 5)
• Bureau New York : +1 (646) 382-0065 (Bronx / Brooklyn)
_Ce devis est une estimation au comptoir valable 7 jours. Merci de votre confiance !_`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateQuoteText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateQuoteText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Transférer directement vers la création d'expédition
  const handleTransferToShipment = () => {
    const payload = {
      direction,
      transportType,
      packagingMode,
      containerType,
      physicalBoxesCount: totalBoxes,
      productLines: items.map(it => ({
        id: it.id,
        category: it.category,
        description: it.description,
        boxes: packagingMode === 'SAME_BOX' ? 1 : it.boxes || 1,
        weight: it.weight || '',
        ratePerKg: it.ratePerKg,
      })),
    };
    sessionStorage.setItem('tangaly_quote_to_shipment', JSON.stringify(payload));
    router.push('/operations/new');
  };

  return (
    <>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Calculateur de Prix Comptoir</h2>
          <p className={styles.cardSubtitle}>
            Estimez instantanément les tarifs pour un client au comptoir, avec multi-produits et partage WhatsApp.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', maxWidth: '1100px' }}>
        {/* Colonne Gauche : Formulaire de calcul */}
        <div className={styles.chartCard} style={{ margin: 0 }}>
          {/* Direction de l'envoi */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Trajet de l'expédition
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDirection('GN_USA')}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  border: direction === 'GN_USA' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: direction === 'GN_USA' ? '#eff6ff' : 'white',
                  color: direction === 'GN_USA' ? '#2563eb' : '#64748b',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                🇬🇳 Guinée ➔ 🇺🇸 USA
              </button>
              <button
                type="button"
                onClick={() => setDirection('USA_GN')}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  border: direction === 'USA_GN' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: direction === 'USA_GN' ? '#eff6ff' : 'white',
                  color: direction === 'USA_GN' ? '#2563eb' : '#64748b',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                🇺🇸 USA ➔ 🇬🇳 Guinée
              </button>
            </div>
          </div>

          {/* Mode de transport */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Mode de transport
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleTransportChange('AERIEN')}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  border: transportType === 'AERIEN' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: transportType === 'AERIEN' ? '#eff6ff' : 'white',
                  color: transportType === 'AERIEN' ? '#2563eb' : '#64748b',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Plane size={16} /> Fret Aérien (Rapide)
              </button>
              <button
                type="button"
                onClick={() => handleTransportChange('MARITIME')}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  border: transportType === 'MARITIME' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                  background: transportType === 'MARITIME' ? '#f0f9ff' : 'white',
                  color: transportType === 'MARITIME' ? '#0284c7' : '#64748b',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ship size={16} /> Fret Maritime (Éco)
              </button>
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: '#f8fafc',
                borderRadius: 6,
              }}
            >
              <Clock size={13} color="#2563eb" />
              Délai moyen constaté :{' '}
              <strong>{transportType === 'AERIEN' ? '5 à 10 jours ouvrés' : '30 à 45 jours'}</strong>
            </div>
          </div>

          {/* Conditionnement : Même carton ou Cartons séparés */}
          <div
            style={{
              background: packagingMode === 'SAME_BOX' ? '#f0fdf4' : '#f8fafc',
              border: packagingMode === 'SAME_BOX' ? '1.5px solid #86efac' : '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={18} color="#15803d" />
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Conditionnement</span>
                  <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Articles regroupés ou séparés ?</p>
                </div>
              </div>

              <div style={{ display: 'flex', background: 'white', padding: '2px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                <button
                  type="button"
                  onClick={() => setPackagingMode('SAME_BOX')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 5,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: packagingMode === 'SAME_BOX' ? '#16a34a' : 'transparent',
                    color: packagingMode === 'SAME_BOX' ? 'white' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Check size={13} /> Même carton
                </button>
                <button
                  type="button"
                  onClick={() => setPackagingMode('SEPARATE_BOXES')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 5,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: packagingMode === 'SEPARATE_BOXES' ? '#2563eb' : 'transparent',
                    color: packagingMode === 'SEPARATE_BOXES' ? 'white' : '#475569',
                  }}
                >
                  Cartons séparés
                </button>
              </div>
            </div>

            {packagingMode === 'SAME_BOX' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', padding: '6px 10px', borderRadius: 6, border: '1px solid #bbf7d0', flexWrap: 'wrap' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>Type :</label>
                <select
                  value={containerType}
                  onChange={e => setContainerType(e.target.value)}
                  style={{ border: 'none', fontSize: 12, fontWeight: 700, color: '#0f172a', background: 'transparent', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Carton">Carton</option>
                  <option value="Baril">Baril</option>
                  <option value="Valise">Valise</option>
                  <option value="Malle">Malle</option>
                  <option value="Sac">Sac</option>
                  <option value="Colis">Colis</option>
                </select>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>Qté physique :</label>
                <input
                  type="number"
                  min="1"
                  value={physicalBoxesCount}
                  onChange={e => setPhysicalBoxesCount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: 40, border: 'none', fontSize: 12, fontWeight: 700, textAlign: 'center', outline: 'none' }}
                />
              </div>
            )}
          </div>

          {/* Liste des articles / marchandises */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                Articles du client ({items.length})
              </label>
              <span style={{ fontSize: 12, color: '#64748b' }}>Tarif ajusté par catégorie</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item, index) => {
                const lineCost = (Number(item.weight) || 0) * (Number(item.ratePerKg) || 0);

                return (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: 12,
                      background: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                        Article #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                          }}
                        >
                          <Trash2 size={13} /> Retirer
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                      <div>
                        <select
                          value={item.category}
                          onChange={e => handleUpdateItem(item.id, 'category', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                            background: 'white',
                            color: '#0f172a',
                            fontWeight: 500,
                          }}
                        >
                          {Object.keys(PRODUCT_CATEGORIES).map(catKey => (
                            <option key={catKey} value={catKey}>
                              {PRODUCT_CATEGORIES[catKey].label} (${getCategoryDefaultRate(catKey, transportType)}/kg)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.ratePerKg}
                          onChange={e => handleUpdateItem(item.id, 'ratePerKg', parseFloat(e.target.value) || 0)}
                          title="Tarif par kg modifiable"
                          placeholder="$/kg"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                            boxSizing: 'border-box',
                            background: 'white',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                      <div>
                        {packagingMode === 'SAME_BOX' ? (
                          <div
                            style={{
                              padding: '8px 6px',
                              borderRadius: 6,
                              background: '#ecfdf5',
                              border: '1px dashed #86efac',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#15803d',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={`Inclus dans le ${containerType}`}
                          >
                            Dans {containerType}
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            value={item.boxes}
                            onChange={e => handleUpdateItem(item.id, 'boxes', parseInt(e.target.value) || 1)}
                            placeholder="Colis"
                            title="Nombre de colis"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              fontSize: 13,
                              boxSizing: 'border-box',
                              background: 'white',
                            }}
                          />
                        )}
                      </div>

                      <div>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.weight}
                          onChange={e =>
                            handleUpdateItem(item.id, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                          }
                          placeholder="Poids (kg)"
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                            boxSizing: 'border-box',
                            background: 'white',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: '#1d4ed8',
                          fontSize: 14,
                        }}
                      >
                        ${lineCost.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              style={{
                marginTop: 10,
                width: '100%',
                padding: '10px',
                border: '1px dashed #94a3b8',
                borderRadius: 8,
                background: '#f8fafc',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} color="#2563eb" /> Ajouter un autre produit au devis
            </button>
          </div>

          {/* Option Poids Volumétrique (Dépliable) */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => setShowVolumetric(!showVolumetric)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: 0,
              }}
            >
              <Box size={14} />
              {showVolumetric
                ? 'Masquer le calcul de volume'
                : '📐 Colis volumineux ? Calculer le poids volumétrique (L × l × H)'}
            </button>

            {showVolumetric && (
              <div style={{ marginTop: 12, padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: 11, color: '#1e40af' }}>
                  Norme fret aérien (IATA) : <code>(L × l × H en cm) ÷ 5000</code>
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    placeholder="L (cm)"
                    value={dimLength}
                    onChange={e => setDimLength(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    style={{ padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: 'white' }}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="l (cm)"
                    value={dimWidth}
                    onChange={e => setDimWidth(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    style={{ padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: 'white' }}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="H (cm)"
                    value={dimHeight}
                    onChange={e => setDimHeight(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    style={{ padding: '8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: 'white' }}
                  />
                </div>

                {volumetricWeight > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      Poids volumétrique : <strong>{volumetricWeight} kg</strong>
                    </span>
                    {isVolumetricHeavier ? (
                      <button
                        type="button"
                        onClick={handleApplyVolumetricWeight}
                        style={{
                          padding: '4px 8px',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Appliquer au devis ({volumetricWeight} kg)
                      </button>
                    ) : (
                      <span style={{ color: '#16a34a', fontSize: 11 }}>Poids réel supérieur ✓</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Taux de change configurable */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: '#64748b',
            }}
          >
            <span>
              Taux USD / GNF :{' '}
              {isEditingRate ? (
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(parseInt(e.target.value) || 8650)}
                  style={{ width: 80, padding: '2px 6px', fontSize: 12, borderRadius: 4, border: '1px solid #cbd5e1' }}
                />
              ) : (
                <strong style={{ color: '#0f172a' }}>1 $ = {exchangeRate.toLocaleString()} GNF</strong>
              )}
            </span>
            <button
              type="button"
              onClick={() => setIsEditingRate(!isEditingRate)}
              style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
            >
              {isEditingRate ? 'Valider' : 'Modifier le taux'}
            </button>
          </div>
        </div>

        {/* Colonne Droite : Carte Résultat & Actions Rapides */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Carte Résultat Devis */}
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Estimation Comptoir
              </span>
              <button
                type="button"
                onClick={handleReset}
                title="Remettre à zéro"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                <RotateCcw size={12} /> Réinitialiser
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#1d4ed8', lineHeight: 1 }}>
                ${totalUSD.toFixed(2)}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#15803d', marginTop: 8 }}>
                ≈ {totalGNF.toLocaleString()} GNF
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Frais de dossier : <span style={{ color: '#16a34a', fontWeight: 600 }}>0 $ (Supprimés)</span>
              </div>
            </div>

            {/* Récapitulatif technique */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Articles au total :</span>
                <strong>{items.length} catégorie(s)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Nombre de colis :</span>
                <strong>
                  {totalBoxes} {packagingMode === 'SAME_BOX' ? `${containerType}${totalBoxes > 1 ? 's' : ''} (Mixte)` : 'carton(s)'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Poids total cumulé :</span>
                <strong style={{ color: '#0f172a' }}>{totalWeight.toFixed(1)} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mode sélectionné :</span>
                <strong>{transportType === 'AERIEN' ? 'Aérien (Express)' : 'Maritime (Éco)'}</strong>
              </div>
            </div>

            {/* Boutons d'action comptoir */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              {/* Convertir en Expédition */}
              <button
                type="button"
                onClick={handleTransferToShipment}
                disabled={totalWeight <= 0}
                style={{
                  padding: '13px',
                  background: totalWeight > 0 ? '#1d4ed8' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: totalWeight > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 2px 4px rgba(29, 78, 216, 0.2)',
                  transition: 'all 0.2s',
                }}
              >
                Créer l'expédition avec ces données <ArrowRight size={16} />
              </button>

              {/* Partager par WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={totalWeight <= 0}
                style={{
                  padding: '11px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: totalWeight > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Share2 size={15} /> Envoyer le devis sur WhatsApp
              </button>

              {/* Copier le devis */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={totalWeight <= 0}
                style={{
                  padding: '10px',
                  background: 'white',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: totalWeight > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {copied ? (
                  <>
                    <Check size={15} color="#16a34a" /> Devis copié dans le presse-papiers !
                  </>
                ) : (
                  <>
                    <Copy size={15} /> Copier le devis au format texte
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Aide rapide de la tarification */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: 16,
              border: '1px solid #e2e8f0',
              fontSize: 12,
              color: '#475569',
            }}
          >
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HelpCircle size={14} color="#2563eb" /> Tarifs indicatifs par type :
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.6 }}>
              <li>Vêtements : 12 $/kg (Aérien) · 5 $/kg (Maritime)</li>
              <li>Médicaments trad. : 20 $/kg · Médicaments pharm. : 22 $/kg</li>
              <li>Liquides &amp; Huiles : 18 $/kg · Fruits : 15 $/kg</li>
              <li>Électronique : 22 $/kg</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
