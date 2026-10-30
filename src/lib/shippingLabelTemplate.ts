export interface ShippingLabelData {
  trackingNumber: string;
  senderName: string;
  senderPhone?: string;
  senderAddress?: string;
  receiverName: string;
  receiverPhone?: string;
  receiverAddress?: string;
  description: string;
  weight: number | string;
  boxes: number | string;
  date?: string;
}

/**
 * Nettoie la description en retirant les prix et tarifs (@ $12/kg = $36.00)
 * pour ne garder que le contenu (ex: 1 Carton (Contenu mixte) : Vêtements & Textiles)
 */
export function cleanLabelDescription(desc: string): string {
  if (!desc) return 'Marchandises diverses';
  let cleaned = desc;

  // 1. Retirer les parenthèses ou crochets contenant un tarif/prix avec '@'
  cleaned = cleaned.replace(/\s*\([^)]*@[^)]*\)/gi, '');
  cleaned = cleaned.replace(/\s*\[[^\]]*@[^\]]*\]/gi, '');

  // 2. Retirer les mentions de prix résiduelles
  cleaned = cleaned.replace(/\s*@[^=,\n]+=\s*[$€£]?\d+(\.\d+)?/gi, '');
  cleaned = cleaned.replace(/\s*@[^,\n)]+/gi, '');

  // 3. Nettoyer la ponctuation superflue
  cleaned = cleaned.replace(/\s*,\s*$/g, '');
  cleaned = cleaned.replace(/,\s*,/g, ',');

  // 4. Si la chaîne est entourée de crochets [ ... ], les enlever
  cleaned = cleaned.trim();
  if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  cleaned = cleaned.replace(/\s*,\s*$/g, '').trim();

  return cleaned || desc;
}

/**
 * Génère le code HTML de l'étiquette complète au format 100mm x 150mm
 */
export function generateShippingLabelHTML(data: ShippingLabelData): string {
  const trackingNumber = data.trackingNumber || 'TGL-NON-DEFINI';
  const displayDate = data.date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  const cleanedDesc = cleanLabelDescription(data.description);
  const formattedWeight = typeof data.weight === 'number' ? data.weight.toFixed(1) : data.weight || '0';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&data=${encodeURIComponent(trackingNumber)}`;

  return `
    <div class="label-container">
      <!-- En-tête officiel TANGALY -->
      <div class="header">
        <div class="header-brand">
          <h1>TANGALY</h1>
          <p>SHIPPING &amp; LOGISTICS</p>
        </div>
        <div class="header-contacts">
          <div>USA : 646-382-0065</div>
          <div>GN : +224 626-98-52-54</div>
          <div style="color: #444; margin-top: 2px;">DATE : ${displayDate}</div>
        </div>
      </div>

      <!-- Expéditeur & Destinataire -->
      <div class="addresses">
        <div class="sender">
          <p class="section-title">FROM / EXPÉDITEUR :</p>
          <p class="sender-name">${data.senderName || '—'}</p>
          ${data.senderPhone ? `<p style="font-size: 11px;">${data.senderPhone}</p>` : ''}
          ${data.senderAddress ? `<p style="font-size: 10px; color: #333;">${data.senderAddress}</p>` : ''}
        </div>
        <div class="receiver">
          <p class="section-title">TO / DESTINATAIRE :</p>
          <p class="receiver-name">${data.receiverName || '—'}</p>
          ${data.receiverPhone ? `<p style="font-size: 13px; font-weight: bold;">${data.receiverPhone}</p>` : ''}
          ${data.receiverAddress ? `<p style="font-size: 12px; font-weight: bold; color: #111;">${data.receiverAddress}</p>` : ''}
        </div>
      </div>

      <!-- Description & Poids / Colis (SANS PRIX NI TARIF) -->
      <div class="details">
        <div class="details-desc">
          <p class="section-title">DESCRIPTION DES MARCHANDISES :</p>
          <p class="details-desc-text">${cleanedDesc}</p>
        </div>
        <div class="details-stats">
          <div>
            <p class="section-title">POIDS</p>
            <p class="stat-val">${formattedWeight} KG</p>
          </div>
          <div>
            <p class="section-title">COLIS</p>
            <p class="stat-val">${data.boxes || 1}</p>
          </div>
        </div>
      </div>

      <!-- QR Code & Numéro de suivi -->
      <div class="qr-section">
        <img id="label-qr-img" class="qr-code" src="${qrUrl}" alt="QR Code ${trackingNumber}" />
        <div class="tracking-info">
          <p class="section-title">TRACKING NO. / SUIVI</p>
          <h2>${trackingNumber}</h2>
        </div>
      </div>

      <!-- Pied de page -->
      <div class="footer-text">
        PLEASE SCAN THIS QR CODE TO UPDATE SHIPMENT STATUS
      </div>
    </div>
  `;
}

/**
 * Fonction unique pour ouvrir la fenêtre et imprimer l'étiquette au format 100mm x 150mm
 */
export function printShippingLabel(data: ShippingLabelData) {
  const win = window.open('', '_blank', 'width=460,height=680');
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Étiquette Colis - ${data.trackingNumber}</title>
        <style>
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100mm;
            height: 150mm;
            max-height: 150mm;
            background: white;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
            overflow: hidden;
          }
          .label-container {
            width: 100mm;
            height: 150mm;
            max-height: 150mm;
            padding: 6mm 7mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 2px solid #000;
            page-break-after: avoid;
            page-break-inside: avoid;
            overflow: hidden;
            background: white;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
          }
          .header-brand h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
            font-style: italic;
            letter-spacing: -0.5px;
            line-height: 1;
          }
          .header-brand p {
            margin: 2px 0 0 0;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .header-contacts {
            text-align: right;
            font-size: 9px;
            font-weight: bold;
            line-height: 1.35;
          }
          .addresses {
            display: flex;
            flex-direction: column;
            gap: 7px;
            border-bottom: 2px solid #000;
            padding: 7px 0;
          }
          .section-title {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 2px 0;
            color: #444;
            letter-spacing: 0.5px;
          }
          .sender p, .receiver p {
            margin: 0;
            line-height: 1.35;
          }
          .sender-name {
            font-weight: bold;
            font-size: 13px;
          }
          .receiver-name {
            font-weight: 900;
            font-size: 16px;
            text-transform: uppercase;
          }
          .details {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #000;
            padding: 7px 0;
            gap: 10px;
          }
          .details-desc {
            flex: 1;
          }
          .details-desc-text {
            font-weight: bold;
            font-size: 12px;
            line-height: 1.35;
            margin: 0;
          }
          .details-stats {
            display: flex;
            gap: 12px;
            text-align: right;
            flex-shrink: 0;
          }
          .stat-val {
            font-weight: 900;
            font-size: 16px;
            margin: 0;
          }
          .qr-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
          }
          .qr-code {
            width: 95px;
            height: 95px;
            border: 1px solid #000;
            padding: 2px;
            display: block;
          }
          .tracking-info {
            text-align: right;
            flex: 1;
            padding-left: 10px;
          }
          .tracking-info h2 {
            margin: 4px 0 0 0;
            font-size: 17px;
            font-weight: 900;
            letter-spacing: 0.5px;
            word-break: break-all;
          }
          .footer-text {
            text-align: center;
            font-size: 8px;
            font-weight: bold;
            border-top: 1.5px solid #000;
            padding-top: 4px;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        ${generateShippingLabelHTML(data)}
        <script>
          const img = document.getElementById('label-qr-img');
          const doPrint = () => {
            setTimeout(() => {
              window.print();
            }, 250);
          };
          if (img) {
            if (img.complete) {
              doPrint();
            } else {
              img.onload = doPrint;
              img.onerror = doPrint;
            }
          } else {
            doPrint();
          }
        </script>
      </body>
    </html>
  `);
  win.document.close();
}
