'use client';
import { useState, useEffect } from 'react';
import styles from '../operations.module.css';
import { Package, User, MapPin, CheckCircle, Printer, X, Plus, Trash2, AlertCircle, Plane, Ship, ArrowRight, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createOperationShipment } from '@/actions/shipments';
import { printShippingLabel } from '@/lib/shippingLabelTemplate';
import { generateDefaultClientPassword } from '@/lib/clientAuthUtils';
import { TANGALY_LOGO_BASE64 } from '@/lib/tangalyLogo';
import { getArticlesTarifsActifs, saveShipmentArticles, ArticleTarifItem } from '@/actions/articles';

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
  articleTarifId: string | null;
  category: string;
  description: string;
  boxes: number;
  weight: number | '';
  quantitePieces: number | '';
  unite: 'KG' | 'PIECE' | 'KG_ET_PIECE';
  ratePerKg: number;
  ratePerPiece: number;
  reductionPct: number;
  raisonReduction: string;
}

export default function NewShipmentPage() {
  const { data: session } = useSession();
  const user = session?.user as { role?: string; localisation?: string; id?: string; name?: string; email?: string } | undefined;
  const userRole = user?.role || '';
  const userLocation = (user?.localisation || '').toLowerCase();

  const isUSAAgent = userLocation.includes('york') || userLocation.includes('usa') || userRole === 'GERANT_USA' || userRole === 'AGENT_USA';

  const [direction, setDirection] = useState<'GN_USA' | 'USA_GN'>(() => {
    return isUSAAgent ? 'USA_GN' : 'GN_USA';
  });
  const [transportType, setTransportType] = useState<'AERIEN' | 'MARITIME'>('AERIEN');

  // Conditionnement : Même carton (colis mixte) ou cartons séparés
  const [packagingMode, setPackagingMode] = useState<'SAME_BOX' | 'SEPARATE_BOXES'>('SAME_BOX');
  const [containerType, setContainerType] = useState('Carton');
  const [physicalBoxesCount, setPhysicalBoxesCount] = useState<number>(1);

  // Catalogue articles depuis la base de données
  const [catalogArticles, setCatalogArticles] = useState<ArticleTarifItem[]>([]);

  // Articles multi-produits
  const [productLines, setProductLines] = useState<ProductItem[]>([
    {
      id: '1',
      articleTarifId: null,
      category: 'Fruits & Denrées',
      description: '',
      boxes: 1,
      weight: '',
      quantitePieces: '',
      unite: 'KG',
      ratePerKg: 15,
      ratePerPiece: 0,
      reductionPct: 0,
      raisonReduction: '',
    },
  ]);

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

  // Paiement
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Modal de reçu
  const [showReceipt, setShowReceipt] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer une estimation transférée depuis le calculateur
    const timer = setTimeout(() => {
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
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  // Chargement du catalogue d'articles selon la direction et le mode de transport
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const dbDirection = direction === 'USA_GN' ? 'USA_CONAKRY' : 'CONAKRY_USA';
        const res = await getArticlesTarifsActifs(dbDirection, transportType);
        if (isMounted && res.success && res.data) {
          setCatalogArticles(res.data);
        }
      } catch (err) {
        console.error('Erreur chargement catalogue articles:', err);
      }
    };
    loadCatalog();
    return () => { isMounted = false; };
  }, [direction, transportType]);

  // Calculs par ligne de produit (avec gestion du tarif par KG, par PIECE et des remises individuelles)
  const calculateLineTotals = (line: ProductItem) => {
    let basePrice = 0;
    const isPiece = line.unite === 'PIECE';
    const isBoth = line.unite === 'KG_ET_PIECE';

    if (isPiece) {
      basePrice = (Number(line.quantitePieces) || 0) * (Number(line.ratePerPiece) || 0);
    } else if (isBoth) {
      const pKg = (Number(line.weight) || 0) * (Number(line.ratePerKg) || 0);
      const pPce = (Number(line.quantitePieces) || 0) * (Number(line.ratePerPiece) || 0);
      basePrice = pKg + pPce;
    } else {
      // Unité KG par défaut
      basePrice = (Number(line.weight) || 0) * (Number(line.ratePerKg) || 0);
    }

    const pct = Math.min(100, Math.max(0, Number(line.reductionPct) || 0));
    const reductionMontant = (basePrice * pct) / 100;
    const finalPrice = Math.max(0, basePrice - reductionMontant);

    return { basePrice, reductionPct: pct, reductionMontant, finalPrice };
  };

  // Sélection d'un article depuis le catalogue
  const handleSelectCatalogArticle = (lineId: string, articleId: string) => {
    if (!articleId) {
      // Retour à la saisie manuelle libre
      const defaultCat = 'Fruits & Denrées';
      setProductLines(prev =>
        prev.map(item =>
          item.id === lineId
            ? {
                ...item,
                articleTarifId: null,
                category: defaultCat,
                description: '',
                unite: 'KG',
                ratePerKg: getCategoryDefaultRate(defaultCat, transportType),
                ratePerPiece: 0,
                reductionPct: 0,
                raisonReduction: '',
              }
            : item
        )
      );
      return;
    }

    const found = catalogArticles.find(a => a.id === articleId);
    if (!found) return;

    setProductLines(prev =>
      prev.map(item =>
        item.id === lineId
          ? {
              ...item,
              articleTarifId: found.id,
              category: found.categorie || 'Autre marchandise',
              description: found.nom,
              unite: found.unite,
              ratePerKg: found.prixParKg ?? 0,
              ratePerPiece: found.prixParPiece ?? 0,
              quantitePieces: found.unite !== 'KG' && !item.quantitePieces ? 1 : item.quantitePieces,
              weight: found.unite !== 'PIECE' && !item.weight ? '' : item.weight,
            }
          : item
      )
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
        articleTarifId: null,
        category: defaultCat,
        description: '',
        boxes: 1,
        weight: '',
        quantitePieces: '',
        unite: 'KG',
        ratePerKg: rate,
        ratePerPiece: 0,
        reductionPct: 0,
        raisonReduction: '',
      },
    ]);
  };

  const removeProductLine = (id: string) => {
    if (productLines.length <= 1) return;
    setProductLines(prev => prev.filter(p => p.id !== id));
  };

  const updateProductLine = (id: string, field: keyof ProductItem, value: string | number) => {
    setProductLines(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'category' && !item.articleTarifId) {
          updated.ratePerKg = getCategoryDefaultRate(String(value), transportType);
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
  const totalReductionAmount = productLines.reduce((acc, curr) => acc + calculateLineTotals(curr).reductionMontant, 0);
  const freightCost = productLines.reduce((acc, curr) => acc + calculateLineTotals(curr).finalPrice, 0);

  const total = freightCost;
  const paid = amountPaid === '' ? total : Number(amountPaid);
  const balance = total - paid;
  const today = new Date().toLocaleDateString('fr-FR');

  const handleSave = async () => {
    if (!senderName || !receiverName) {
      setError('Veuillez renseigner au minimum le nom de l’expéditeur et du destinataire.');
      return;
    }
    if (totalWeight <= 0 && total <= 0) {
      setError('Veuillez saisir un poids ou une quantité pour au moins un produit.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Générer une description structurée et lisible avec détail des réductions s'il y a lieu
      const formattedDescription =
        packagingMode === 'SAME_BOX'
          ? `[${physicalBoxesCount} ${containerType}${physicalBoxesCount > 1 ? 's' : ''} (Contenu mixte) : ` +
            productLines
              .map(p => {
                const { reductionPct, reductionMontant, finalPrice } = calculateLineTotals(p);
                const desc = p.description || p.category;
                const qtyText = p.unite === 'PIECE'
                  ? `${p.quantitePieces || 1} pce(s) @ $${p.ratePerPiece}`
                  : p.unite === 'KG_ET_PIECE'
                  ? `${p.weight} kg @ $${p.ratePerKg} + ${p.quantitePieces || 1} pce(s) @ $${p.ratePerPiece}`
                  : `${p.weight} kg @ $${p.ratePerKg}/kg`;
                const reducText = reductionPct > 0 ? ` (Remise -${reductionPct}%: -$${reductionMontant.toFixed(2)})` : '';
                return `${desc} (${qtyText}${reducText} = $${finalPrice.toFixed(2)})`;
              })
              .join(', ') +
            ']'
          : productLines
              .map(p => {
                const { reductionPct, reductionMontant, finalPrice } = calculateLineTotals(p);
                const desc = p.description || p.category;
                const qtyText = p.unite === 'PIECE'
                  ? `${p.quantitePieces || 1} pce(s) @ $${p.ratePerPiece}`
                  : p.unite === 'KG_ET_PIECE'
                  ? `${p.weight} kg @ $${p.ratePerKg} + ${p.quantitePieces || 1} pce(s) @ $${p.ratePerPiece}`
                  : `${p.weight} kg @ $${p.ratePerKg}/kg`;
                const reducText = reductionPct > 0 ? ` [Remise -${reductionPct}%: -$${reductionMontant.toFixed(2)}]` : '';
                return `${desc} [${p.boxes} colis, ${qtyText}${reducText} = $${finalPrice.toFixed(2)}]`;
              })
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

      // Sauvegarde des articles détaillés avec remises par article en base
      if (res.data?.id) {
        const shipmentArticles = productLines.map(p => {
          const { reductionPct, reductionMontant, finalPrice } = calculateLineTotals(p);
          const isPiece = p.unite === 'PIECE';
          const qty = isPiece ? (Number(p.quantitePieces) || 1) : (Number(p.weight) || 0);
          const unitPrice = isPiece ? Number(p.ratePerPiece) : Number(p.ratePerKg);
          return {
            articleTarifId: p.articleTarifId || null,
            nom: p.description ? `${p.description}${p.category ? ` (${p.category})` : ''}` : p.category || 'Article',
            unite: (p.unite === 'PIECE' ? 'PIECE' : 'KG') as 'KG' | 'PIECE',
            quantite: qty,
            prixUnitaire: unitPrice,
            reductionPct,
            reductionMontant: Number(reductionMontant.toFixed(2)),
            prixFinal: Number(finalPrice.toFixed(2)),
            raisonReduction: p.raisonReduction || null,
          };
        });
        await saveShipmentArticles(res.data.id, shipmentArticles);
      }

      setTrackingNumber(res.data?.tracking_number || '');
      setShowReceipt(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg);
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
        articleTarifId: null,
        category: 'Fruits & Denrées',
        description: '',
        boxes: 1,
        weight: '',
        quantitePieces: '',
        unite: 'KG',
        ratePerKg: getCategoryDefaultRate('Fruits & Denrées', transportType),
        ratePerPiece: 0,
        reductionPct: 0,
        raisonReduction: '',
      },
    ]);
    setAmountPaid('');
    setShowReceipt(false);
    setError(null);
  };

  const printLabel = () => {
    const fullSenderPhone = senderPhone.trim().startsWith('+')
      ? senderPhone.trim()
      : `${senderPrefix} ${senderPhone.trim()}`;

    const fullReceiverPhone = receiverPhone.trim().startsWith('+')
      ? receiverPhone.trim()
      : `${receiverPrefix} ${receiverPhone.trim()}`;

    const labelDesc =
      packagingMode === 'SAME_BOX'
        ? `${physicalBoxesCount} ${containerType}${physicalBoxesCount > 1 ? 's' : ''} (Contenu mixte) : ` +
          productLines.map(p => `${p.category}${p.description ? ` (${p.description})` : ''}`).join(', ')
        : productLines.map(p => `${p.category}${p.description ? ` (${p.description})` : ''}`).join(', ');

    printShippingLabel({
      trackingNumber,
      senderName,
      senderPhone: fullSenderPhone,
      senderAddress,
      receiverName,
      receiverPhone: fullReceiverPhone,
      receiverAddress,
      description: labelDesc,
      weight: totalWeight,
      boxes: totalBoxes,
    });
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
              <base href="${typeof window !== 'undefined' ? window.location.origin : ''}/">
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

              {/* Tableau compact des lignes d'articles */}
              <div
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  background: 'white',
                  overflow: 'hidden',
                  marginBottom: '14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: packagingMode === 'SEPARATE_BOXES' ? '920px' : '860px',
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          textAlign: 'left',
                        }}
                      >
                        <th style={{ padding: '10px 12px', width: 36, color: '#475569', fontWeight: 600, fontSize: 12, textAlign: 'center' }}>
                          #
                        </th>
                        <th style={{ padding: '10px 12px', minWidth: 220, color: '#475569', fontWeight: 600, fontSize: 12 }}>
                          Article &amp; Tarif du Catalogue *
                        </th>
                        <th style={{ padding: '10px 12px', minWidth: 160, color: '#475569', fontWeight: 600, fontSize: 12 }}>
                          Description / Détails
                        </th>
                        {packagingMode === 'SEPARATE_BOXES' && (
                          <th style={{ padding: '10px 12px', width: 75, color: '#475569', fontWeight: 600, fontSize: 12, textAlign: 'center' }}>
                            Colis
                          </th>
                        )}
                        <th style={{ padding: '10px 12px', width: 130, color: '#475569', fontWeight: 600, fontSize: 12 }}>
                          Quantité / Poids *
                        </th>
                        <th style={{ padding: '10px 12px', width: 110, color: '#475569', fontWeight: 600, fontSize: 12, textAlign: 'center' }}>
                          Tarif Unitaire
                        </th>
                        <th style={{ padding: '10px 12px', width: 140, color: '#475569', fontWeight: 600, fontSize: 12 }}>
                          Remise (%)
                        </th>
                        <th style={{ padding: '10px 12px', width: 120, color: '#475569', fontWeight: 600, fontSize: 12, textAlign: 'right' }}>
                          Sous-total Net
                        </th>
                        <th style={{ padding: '10px 12px', width: 40, textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {productLines.map((line, index) => {
                        const { basePrice, reductionPct, reductionMontant, finalPrice } = calculateLineTotals(line);
                        const isPiece = line.unite === 'PIECE';
                        const isBoth = line.unite === 'KG_ET_PIECE';

                        return (
                          <tr
                            key={line.id}
                            style={{
                              borderBottom: index === productLines.length - 1 ? 'none' : '1px solid #f1f5f9',
                              background: index % 2 === 0 ? 'white' : '#fafafa',
                              transition: 'background 0.15s',
                            }}
                          >
                            {/* Numéro */}
                            <td style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <span
                                style={{
                                  background: '#2563eb',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: 22,
                                  height: 22,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                {index + 1}
                              </span>
                            </td>

                            {/* Choix Article depuis catalogue ou Catégorie générique */}
                            <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <select
                                  value={line.articleTarifId || ''}
                                  onChange={e => handleSelectCatalogArticle(line.id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '7px 10px',
                                    border: line.articleTarifId ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: 13,
                                    background: line.articleTarifId ? '#eff6ff' : 'white',
                                    fontWeight: line.articleTarifId ? 600 : 500,
                                    color: '#0f172a',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <option value="">✍️ Produit libre / Catégorie générale...</option>
                                  {catalogArticles.length > 0 && (
                                    <optgroup label="── Articles du Catalogue Tangaly ──">
                                      {catalogArticles.map(art => {
                                        const tar = art.unite === 'PIECE'
                                          ? `$${art.prixParPiece}/pce`
                                          : art.unite === 'KG_ET_PIECE'
                                          ? `$${art.prixParKg}/kg + $${art.prixParPiece}/pce`
                                          : `$${art.prixParKg}/kg`;
                                        return (
                                          <option key={art.id} value={art.id}>
                                            📦 {art.nom} ({tar})
                                          </option>
                                        );
                                      })}
                                    </optgroup>
                                  )}
                                </select>

                                {!line.articleTarifId && (
                                  <select
                                    value={line.category}
                                    onChange={e => updateProductLine(line.id, 'category', e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '5px 8px',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '4px',
                                      fontSize: 11,
                                      background: '#f8fafc',
                                      color: '#475569',
                                      outline: 'none',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {Object.keys(PRODUCT_CATEGORIES).map(catKey => (
                                      <option key={catKey} value={catKey}>
                                        {PRODUCT_CATEGORIES[catKey].label} (${getCategoryDefaultRate(catKey, transportType)}/kg)
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </td>

                            {/* Description / Détails */}
                            <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                              <input
                                type="text"
                                value={line.description}
                                onChange={e => updateProductLine(line.id, 'description', e.target.value)}
                                placeholder={line.articleTarifId ? 'Précision (marque, modèle...)' : 'ex: Chaussures Nike, iPhone...'}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: 13,
                                  outline: 'none',
                                  background: 'white',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </td>

                            {/* Colis (si cartons séparés) */}
                            {packagingMode === 'SEPARATE_BOXES' && (
                              <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                                <input
                                  type="number"
                                  min="1"
                                  value={line.boxes}
                                  onChange={e => updateProductLine(line.id, 'boxes', Math.max(1, parseInt(e.target.value) || 1))}
                                  style={{
                                    width: '100%',
                                    padding: '7px 8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: 13,
                                    outline: 'none',
                                    background: 'white',
                                    boxSizing: 'border-box',
                                    textAlign: 'center',
                                  }}
                                />
                              </td>
                            )}

                            {/* Quantité ou Poids selon l'unité */}
                            <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                              {isPiece ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={line.quantitePieces}
                                    onChange={e => updateProductLine(line.id, 'quantitePieces', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                                    placeholder="1"
                                    style={{
                                      width: '100%',
                                      padding: '7px 8px',
                                      border: '1.5px solid #6366f1',
                                      borderRadius: '6px',
                                      fontSize: 13,
                                      outline: 'none',
                                      background: '#f5f3ff',
                                      boxSizing: 'border-box',
                                      textAlign: 'center',
                                      fontWeight: 600,
                                    }}
                                  />
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', whiteSpace: 'nowrap' }}>pce(s)</span>
                                </div>
                              ) : isBoth ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={line.weight}
                                      onChange={e => updateProductLine(line.id, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                      placeholder="0"
                                      style={{ width: '100%', padding: '5px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 12, textAlign: 'center' }}
                                    />
                                    <span style={{ fontSize: 11, color: '#475569' }}>kg</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <input
                                      type="number"
                                      min="1"
                                      step="1"
                                      value={line.quantitePieces}
                                      onChange={e => updateProductLine(line.id, 'quantitePieces', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                                      placeholder="1"
                                      style={{ width: '100%', padding: '5px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: 12, textAlign: 'center' }}
                                    />
                                    <span style={{ fontSize: 11, color: '#475569' }}>pce</span>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={line.weight}
                                    onChange={e => updateProductLine(line.id, 'weight', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                    placeholder="ex: 12.5"
                                    style={{
                                      width: '100%',
                                      padding: '7px 8px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: 13,
                                      outline: 'none',
                                      background: 'white',
                                      boxSizing: 'border-box',
                                      textAlign: 'center',
                                    }}
                                  />
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>kg</span>
                                </div>
                              )}
                            </td>

                            {/* Tarif unitaire */}
                            <td style={{ padding: '8px 10px', verticalAlign: 'top', textAlign: 'center' }}>
                              {isPiece ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                  <span style={{ fontSize: 12, color: '#64748b' }}>$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={line.ratePerPiece}
                                    onChange={e => updateProductLine(line.id, 'ratePerPiece', parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: '60px',
                                      padding: '7px 4px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: 13,
                                      outline: 'none',
                                      textAlign: 'center',
                                      fontWeight: 600,
                                    }}
                                  />
                                  <span style={{ fontSize: 10, color: '#64748b' }}>/pce</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                  <span style={{ fontSize: 12, color: '#64748b' }}>$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={line.ratePerKg}
                                    onChange={e => updateProductLine(line.id, 'ratePerKg', parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: '60px',
                                      padding: '7px 4px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: 13,
                                      outline: 'none',
                                      textAlign: 'center',
                                      fontWeight: 600,
                                    }}
                                  />
                                  <span style={{ fontSize: 10, color: '#64748b' }}>/kg</span>
                                </div>
                              )}
                            </td>

                            {/* Réduction / Remise (%) et motif */}
                            <td style={{ padding: '8px 10px', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={line.reductionPct || ''}
                                    onChange={e => {
                                      const val = e.target.value === '' ? 0 : Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                                      updateProductLine(line.id, 'reductionPct', val);
                                    }}
                                    placeholder="0"
                                    style={{
                                      width: '55px',
                                      padding: '6px 4px',
                                      border: reductionPct > 0 ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                                      borderRadius: '6px',
                                      fontSize: 12,
                                      textAlign: 'center',
                                      fontWeight: reductionPct > 0 ? 700 : 500,
                                      color: reductionPct > 0 ? '#15803d' : '#0f172a',
                                      background: reductionPct > 0 ? '#f0fdf4' : 'white',
                                      outline: 'none',
                                    }}
                                  />
                                  <span style={{ fontSize: 12, fontWeight: 700, color: reductionPct > 0 ? '#15803d' : '#64748b' }}>%</span>
                                  {reductionPct > 0 && (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>
                                      (-${reductionMontant.toFixed(2)})
                                    </span>
                                  )}
                                </div>
                                {reductionPct > 0 && (
                                  <input
                                    type="text"
                                    value={line.raisonReduction || ''}
                                    onChange={e => updateProductLine(line.id, 'raisonReduction', e.target.value)}
                                    placeholder="Motif (ex: client régulier)"
                                    style={{
                                      width: '100%',
                                      padding: '3px 6px',
                                      border: '1px dashed #86efac',
                                      borderRadius: '4px',
                                      fontSize: 10,
                                      color: '#166534',
                                      background: '#f0fdf4',
                                      outline: 'none',
                                      boxSizing: 'border-box',
                                    }}
                                  />
                                )}
                              </div>
                            </td>

                            {/* Sous-total Net */}
                            <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                {reductionPct > 0 && (
                                  <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                                    ${basePrice.toFixed(2)}
                                  </span>
                                )}
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '5px 10px',
                                    background: reductionPct > 0 ? '#f0fdf4' : '#eff6ff',
                                    border: reductionPct > 0 ? '1px solid #86efac' : '1px solid #bfdbfe',
                                    borderRadius: '6px',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: reductionPct > 0 ? '#15803d' : '#1d4ed8',
                                    minWidth: '70px',
                                    textAlign: 'right',
                                  }}
                                >
                                  ${finalPrice.toFixed(2)}
                                </span>
                              </div>
                            </td>

                            {/* Action Supprimer */}
                            <td style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                              {productLines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeProductLine(line.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '5px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.15s',
                                  }}
                                  title="Supprimer cette ligne"
                                  onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bouton Ajouter un produit */}
              <button
                type="button"
                onClick={addProductLine}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  background: '#f1f5f9',
                  border: '1px dashed #94a3b8',
                  borderRadius: '8px',
                  color: '#1e293b',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '18px',
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
                <Plus size={16} color="#2563eb" /> Ajouter un autre produit (médicaments, liquides, fruits, chaussures...)
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
                    <span style={{ color: '#475569' }}>Frais d&apos;expédition (Fret) :</span>
                    <strong style={{ color: '#0f172a' }}>${(freightCost + totalReductionAmount).toFixed(2)}</strong>
                  </div>

                  {totalReductionAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14, color: '#16a34a' }}>
                      <span style={{ fontWeight: 600 }}>Remises Déduites :</span>
                      <strong>-${totalReductionAmount.toFixed(2)}</strong>
                    </div>
                  )}

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={TANGALY_LOGO_BASE64}
                alt="TANGALY Logo"
                style={{
                  height: '52px',
                  width: 'auto',
                  maxWidth: '160px',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  display: 'block',
                }}
              />
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
              REÇU D&apos;EXPÉDITION · SHIPPING RECEIPT
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
                ['Mot de passe / Pwd', generateDefaultClientPassword(senderPhone) + ' (espace client)', true],
              ].map(([label, val, bold], idx) => (
                <div key={String(label)} style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px', gap: '6px' }}>
                  <span style={{ color: idx === 3 ? '#1d4ed8' : '#64748b', fontWeight: idx === 3 ? 'bold' : 'normal', whiteSpace: 'nowrap', fontSize: '9px', minWidth: '85px' }}>{String(label)}</span>
                  <span style={{ fontWeight: bold ? 'bold' : 'normal', fontSize: '10px', color: idx === 3 ? '#1d4ed8' : '#0f172a', borderBottom: '1px solid #e2e8f0', flex: 1, fontFamily: idx === 3 ? 'monospace' : 'inherit' }}>
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
                ['Suivi colis', 'tangaly.com/tracking', false],
              ].map(([label, val, bold], idx) => (
                <div key={String(label)} style={{ display: 'flex', alignItems: 'baseline', marginBottom: '3px', gap: '6px' }}>
                  <span style={{ color: idx === 3 ? '#15803d' : '#64748b', fontWeight: idx === 3 ? 'bold' : 'normal', whiteSpace: 'nowrap', fontSize: '9px', minWidth: '85px' }}>{String(label)}</span>
                  <span style={{ fontWeight: bold ? 'bold' : 'normal', fontSize: '10px', color: idx === 3 ? '#15803d' : '#0f172a', borderBottom: '1px solid #e2e8f0', flex: 1 }}>
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
                <th style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  QUANTITÉ / POIDS
                </th>
                <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  TARIF UNITAIRE
                </th>
                <th style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  REMISE
                </th>
                <th style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '9px', color: '#334155', borderBottom: '1px solid #cbd5e1' }}>
                  SOUS-TOTAL NET
                </th>
              </tr>
            </thead>
            <tbody>
              {productLines.map((line, idx) => {
                const { basePrice, reductionPct, reductionMontant, finalPrice } = calculateLineTotals(line);
                const isPiece = line.unite === 'PIECE';
                const isBoth = line.unite === 'KG_ET_PIECE';

                const qtyLabel = isPiece
                  ? `${line.quantitePieces || 1} pce(s)`
                  : isBoth
                  ? `${line.weight || 0} kg + ${line.quantitePieces || 1} pce(s)`
                  : `${Number(line.weight || 0).toFixed(1)} kg`;

                const rateLabel = isPiece
                  ? `$${line.ratePerPiece}/pce`
                  : isBoth
                  ? `$${line.ratePerKg}/kg + $${line.ratePerPiece}/pce`
                  : `$${line.ratePerKg}/kg`;

                return (
                  <tr key={line.id} style={{ background: idx % 2 === 1 ? '#f8fafc' : 'white' }}>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid #e2e8f0' }}>
                      <strong style={{ color: '#0f172a' }}>{line.description || line.category}</strong>
                      {line.description && line.category && (
                        <span style={{ color: '#64748b', fontSize: '9px', marginLeft: 6 }}>({line.category})</span>
                      )}
                      {reductionPct > 0 && line.raisonReduction && (
                        <div style={{ fontSize: '8px', color: '#15803d', fontStyle: 'italic' }}>Motif: {line.raisonReduction}</div>
                      )}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                      {packagingMode === 'SAME_BOX' ? `${containerType} (Mixte)` : line.boxes}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                      {qtyLabel}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>
                      {rateLabel}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: reductionPct > 0 ? '#15803d' : '#64748b' }}>
                      {reductionPct > 0 ? `-${reductionPct}% (-$${reductionMontant.toFixed(2)})` : '—'}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                      {reductionPct > 0 && (
                        <span style={{ fontSize: '8px', color: '#94a3b8', textDecoration: 'line-through', marginRight: 4 }}>
                          ${basePrice.toFixed(2)}
                        </span>
                      )}
                      ${finalPrice.toFixed(2)}
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
                <td style={{ padding: '6px 8px', textAlign: 'center', borderTop: '2px solid #cbd5e1' }}>{totalWeight.toFixed(1)} kg</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', borderTop: '2px solid #cbd5e1' }}>—</td>
                <td style={{ padding: '6px 8px', textAlign: 'center', borderTop: '2px solid #cbd5e1', color: '#15803d' }}>
                  {totalReductionAmount > 0 ? `-$${totalReductionAmount.toFixed(2)}` : '—'}
                </td>
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
              <span style={{ fontWeight: 'bold' }}>${(freightCost + totalReductionAmount).toFixed(2)}</span>
            </div>
            {totalReductionAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px', color: '#15803d' }}>
                <span>Remise · Discount</span>
                <span style={{ fontWeight: 'bold' }}>-${totalReductionAmount.toFixed(2)}</span>
              </div>
            )}
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
              <li>Tangaly Shipping n&apos;est pas responsable des articles interdits ou illégaux.</li>
              <li>Tangaly Shipping n&apos;est pas responsable des dommages dus à un mauvais emballage.</li>
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
