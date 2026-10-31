export interface ReceiptData {
  id: string;
  colis?: string;
  date: string;
  typeTransport?: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  description: string;
  boxes: number;
  weight: number;
  ratePerKg: number;
  freightCost: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethod?: string;
}

export function generateModernReceiptHTML(inv: ReceiptData): string {
  const trackingNumber = inv.colis || inv.id;
  const transportMode =
    inv.typeTransport === 'MARITIME' || inv.typeTransport === 'SEA'
      ? 'MARITIME (SEA)'
      : 'AÉRIEN (AIR)';
  const method = (inv.paymentMethod || 'CASH').toUpperCase();

  const formattedFreight = Number(inv.freightCost || inv.total || 0).toFixed(2);
  const formattedTotal = Number(inv.total || 0).toFixed(2);
  const formattedPaid = Number(inv.amountPaid || 0).toFixed(2);
  const formattedBalance = Number(inv.balance || 0).toFixed(2);
  const formattedWeight = Number(inv.weight || 0).toFixed(1);
  const formattedRate = Number(inv.ratePerKg || (Number(inv.weight) > 0 ? Number(inv.total) / Number(inv.weight) : 12)).toFixed(2);

  return `
    <div style="font-family: Arial, sans-serif; color: #111; background: white; padding: 18px 24px; max-width: 800px; margin: 0 auto; box-sizing: border-box; font-size: 11px;">
      
      <!-- ── EN-TÊTE OFFICIEL TANGALY ── -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <img 
            src="/lo.jpeg" 
            alt="TANGALY Logo" 
            style="height: 56px; max-width: 170px; object-fit: contain; border-radius: 6px; display: block;" 
          />
          <div>
            <div style="color: #1d4ed8; font-weight: 900; font-size: 24px; font-style: italic; line-height: 1; letter-spacing: -0.5px;">
              TANGALY
            </div>
            <div style="color: #dc2626; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; margin-top: 3px;">
              SHIPPING &amp; LOGISTICS
            </div>
            <div style="color: #64748b; font-size: 10px; margin-top: 3px;">
              Fret aérien &amp; maritime USA ⇌ Guinée (Conakry) · Air &amp; Ocean Freight USA ⇌ Guinea
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <div style="color: #dc2626; font-weight: bold; font-size: 10px; letter-spacing: 1px; margin-bottom: 4px;">
            REÇU D&apos;EXPÉDITION · SHIPPING RECEIPT
          </div>
          <div style="border: 2px solid #dc2626; padding: 6px 18px; border-radius: 6px; margin-bottom: 5px; display: inline-block;">
            <span style="color: #dc2626; font-weight: 900; font-size: 15px; letter-spacing: 0.5px;">N° ${trackingNumber}</span>
          </div>
          <div style="font-size: 11px; color: #334155;">
            Date : <strong>${inv.date}</strong> · Mode : <strong>${transportMode}</strong>
          </div>
        </div>
      </div>

      <!-- ── BANDEAU COULEURS GUINÉE ── -->
      <div style="display: flex; height: 5px; margin-bottom: 12px; border-radius: 2px; overflow: hidden;">
        <div style="flex: 1; background: #CE1126;"></div>
        <div style="flex: 1; background: #FCD116;"></div>
        <div style="flex: 1; background: #009460;"></div>
      </div>

      <!-- ── COORDONNÉES DES AGENCES (USA & GUINÉE) ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div style="border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 12px; background: #eff6ff;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: #1d4ed8; color: white; font-weight: bold; font-size: 9px; padding: 2px 5px; border-radius: 3px; letter-spacing: 0.5px;">USA</span>
            <span style="font-weight: bold; color: #1d4ed8; font-size: 11px;">Agence USA</span>
          </div>
          <div style="color: #334155; line-height: 1.45; font-size: 10px;">
            3429 3rd Ave, Bronx, NY 10456<br />
            28 Arlington Avenue, Brooklyn, NY 11207<br />
            <strong style="color: #1d4ed8;">+1 (646) 382-0065</strong>
          </div>
        </div>

        <div style="border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 12px; background: #f0fdf4;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: #15803d; color: white; font-weight: bold; font-size: 9px; padding: 2px 5px; border-radius: 3px; letter-spacing: 0.5px;">GN</span>
            <span style="font-weight: bold; color: #15803d; font-size: 11px;">Guinée (Conakry)</span>
          </div>
          <div style="color: #334155; line-height: 1.45; font-size: 10px;">
            Cité Enco 5 · <strong style="color: #15803d;">+224 626 98 52 54</strong><br />
            Zelle : 347-819-6217 · Orange Money : 611-62-83-27
          </div>
        </div>
      </div>

      <!-- ── BLOCS EXPÉDITEUR & DESTINATAIRE ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
          <div style="background: #1d4ed8; color: white; font-weight: bold; font-size: 10px; padding: 5px 10px; letter-spacing: 0.5px;">
            EXPÉDITEUR · SENDER
          </div>
          <div style="padding: 8px 10px; font-size: 11px; line-height: 1.5;">
            <div style="display: flex; align-items: baseline; margin-bottom: 3px; gap: 6px;">
              <span style="color: #64748b; white-space: nowrap; font-size: 10px; min-width: 85px;">Nom / Name</span>
              <span style="font-weight: bold; border-bottom: 1px solid #e2e8f0; flex: 1; color: #0f172a;">${inv.senderName || '—'}</span>
            </div>
            <div style="display: flex; align-items: baseline; margin-bottom: 3px; gap: 6px;">
              <span style="color: #64748b; white-space: nowrap; font-size: 10px; min-width: 85px;">Tél. / Phone</span>
              <span style="font-weight: bold; border-bottom: 1px solid #e2e8f0; flex: 1; color: #0f172a;">${inv.senderPhone || '—'}</span>
            </div>
            <div style="display: flex; align-items: baseline; gap: 6px;">
              <span style="color: #64748b; white-space: nowrap; font-size: 10px; min-width: 85px;">Adresse / Address</span>
              <span style="border-bottom: 1px solid #e2e8f0; flex: 1; color: #0f172a;">${inv.senderAddress || '—'}</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
          <div style="background: #15803d; color: white; font-weight: bold; font-size: 10px; padding: 5px 10px; letter-spacing: 0.5px;">
            DESTINATAIRE · RECEIVER
          </div>
          <div style="padding: 8px 10px; font-size: 11px; line-height: 1.5;">
            <div style="display: flex; align-items: baseline; margin-bottom: 3px; gap: 6px;">
              <span style="color: #64748b; white-space: nowrap; font-size: 10px; min-width: 85px;">Nom / Name</span>
              <span style="font-weight: bold; border-bottom: 1px solid #e2e8f0; flex: 1; color: #0f172a;">${inv.receiverName || '—'}</span>
            </div>
            <div style="display: flex; align-items: baseline; margin-bottom: 3px; gap: 6px;">
              <span style="color: #64748b; white-space: nowrap; font-size: 10px; min-width: 85px;">Tél. / Phone</span>
              <span style="font-weight: bold; border-bottom: 1px solid #e2e8f0; flex: 1; color: #0f172a;">${inv.receiverPhone || '—'}</span>
            </div>
            <div style="display: flex; align-items: baseline; gap: 6px;">
              <span style="color: #64748b; white-space: nowrap; font-size: 10px; min-width: 85px;">Ville / City</span>
              <span style="border-bottom: 1px solid #e2e8f0; flex: 1; color: #0f172a;">${inv.receiverAddress || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TABLEAU DÉTAILS DES PRODUITS & MARCHANDISES ── -->
      <div style="margin-bottom: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
        <div style="background: #eff6ff; color: #1d4ed8; font-weight: bold; font-size: 10px; padding: 6px 10px; border-bottom: 1px solid #bfdbfe; letter-spacing: 0.5px;">
          DÉTAILS DES PRODUITS &amp; MARCHANDISES · ITEMS &amp; SHIPPING RATES
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; text-align: left;">
              <th style="padding: 6px 10px; font-weight: bold; font-size: 10px; color: #334155;">ARTICLE / MARCHANDISE</th>
              <th style="padding: 6px 10px; font-weight: bold; font-size: 10px; color: #334155; text-align: center;">CONTENANT / COLIS</th>
              <th style="padding: 6px 10px; font-weight: bold; font-size: 10px; color: #334155; text-align: right;">POIDS (KG)</th>
              <th style="padding: 6px 10px; font-weight: bold; font-size: 10px; color: #334155; text-align: right;">TARIF / KG</th>
              <th style="padding: 6px 10px; font-weight: bold; font-size: 10px; color: #334155; text-align: right;">SOUS-TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">
                ${inv.description || 'Marchandises diverses'}
              </td>
              <td style="padding: 8px 10px; text-align: center; color: #475569;">
                Carton (${inv.boxes || 1})
              </td>
              <td style="padding: 8px 10px; text-align: right; font-weight: 600;">
                ${formattedWeight} kg
              </td>
              <td style="padding: 8px 10px; text-align: right; color: #475569;">
                $${formattedRate}/kg
              </td>
              <td style="padding: 8px 10px; text-align: right; font-weight: bold; color: #0f172a;">
                $${formattedTotal}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td style="padding: 7px 10px; border-top: 1.5px solid #cbd5e1; color: #1d4ed8;">
                TOTAL CUMULÉ (1 article)
              </td>
              <td style="padding: 7px 10px; text-align: center; border-top: 1.5px solid #cbd5e1;">
                ${inv.boxes || 1} Carton${Number(inv.boxes) > 1 ? 's' : ''}
              </td>
              <td style="padding: 7px 10px; text-align: right; border-top: 1.5px solid #cbd5e1;">
                ${formattedWeight} kg
              </td>
              <td style="padding: 7px 10px; text-align: right; border-top: 1.5px solid #cbd5e1; color: #64748b;">
                —
              </td>
              <td style="padding: 7px 10px; text-align: right; border-top: 1.5px solid #cbd5e1; color: #1d4ed8; font-size: 12px;">
                $${formattedTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ── MODE DE PAIEMENT & RÉCAPITULATIF FINANCIER ── -->
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; margin-bottom: 14px; align-items: start;">
        <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; height: 100%; box-sizing: border-box;">
          <div style="font-weight: bold; color: #1d4ed8; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 8px;">
            MODE DE PAIEMENT · PAYMENT METHOD
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border: 1.5px solid #cbd5e1; border-radius: 3px; background: ${method.includes('CASH') || method.includes('ESP') ? '#1d4ed8' : 'white'}; color: white; font-size: 10px; font-weight: bold;">
                ${method.includes('CASH') || method.includes('ESP') ? '✓' : ''}
              </span>
              Espèces / Cash
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border: 1.5px solid #cbd5e1; border-radius: 3px; background: ${method.includes('ZELLE') ? '#1d4ed8' : 'white'}; color: white; font-size: 10px; font-weight: bold;">
                ${method.includes('ZELLE') ? '✓' : ''}
              </span>
              Zelle
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border: 1.5px solid #cbd5e1; border-radius: 3px; background: ${method.includes('ORANGE') ? '#1d4ed8' : 'white'}; color: white; font-size: 10px; font-weight: bold;">
                ${method.includes('ORANGE') ? '✓' : ''}
              </span>
              Orange Money
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border: 1.5px solid #cbd5e1; border-radius: 3px; background: ${method.includes('AUTRE') || method.includes('OTHER') ? '#1d4ed8' : 'white'}; color: white; font-size: 10px; font-weight: bold;">
                ${method.includes('AUTRE') || method.includes('OTHER') ? '✓' : ''}
              </span>
              Autre / Other
            </div>
          </div>
        </div>

        <div style="min-width: 220px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #475569;">
            <span>Fret Total · Freight</span>
            <span style="font-weight: bold; color: #0f172a;">$${formattedFreight}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-top: 1px solid #e2e8f0; font-weight: bold; font-size: 12px;">
            <span>Montant Total</span>
            <span style="color: #1d4ed8;">$${formattedTotal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 3px 0; color: #16a34a; font-weight: bold;">
            <span>Payé · Paid</span>
            <span>$${formattedPaid}</span>
          </div>
          <div style="margin-top: 6px; background: #dc2626; color: white; border-radius: 4px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 12px;">
            <span>Reste à payer · Balance</span>
            <span style="font-size: 14px;">$${formattedBalance}</span>
          </div>
        </div>
      </div>

      <!-- ── SIGNATURES ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 12px; margin-top: 16px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #334155; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; color: #64748b;">Signature client · Customer</div>
        </div>
        <div style="text-align: center;">
          <div style="border-top: 1px solid #334155; margin-bottom: 4px;"></div>
          <div style="font-size: 9px; color: #64748b;">Cachet &amp; signature · Tangaly</div>
        </div>
      </div>

      <!-- ── ACCÈS ESPACE CLIENT ── -->
      <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 5px; padding: 6px 10px; margin-bottom: 10px; font-size: 8.5px; color: #334155; display: flex; justify-content: space-between; align-items: center;">
        <span>📱 <strong>Espace Client :</strong> Suivez vos colis sur <strong>tangaly.com/login</strong> avec votre téléphone</span>
        <span style="color: #64748b;">Mot de passe initial : <strong>tangaly</strong> + 4 derniers chiffres</span>
      </div>

      <!-- ── CONDITIONS GÉNÉRALES BILINGUES (2 COLONNES) ── -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 8px; color: #64748b; line-height: 1.45; border-top: 1px solid #e2e8f0; padding-top: 8px;">
        <div>
          <div style="font-weight: bold; color: #334155; margin-bottom: 2px;">Terms &amp; Conditions</div>
          <ul style="margin: 0; padding-left: 12px;">
            <li>Tangaly Shipping is not responsible for prohibited or illegal items.</li>
            <li>Tangaly Shipping is not liable for damage due to improper packaging.</li>
            <li>Estimated delivery time: 5–10 business days.</li>
          </ul>
        </div>
        <div>
          <div style="font-weight: bold; color: #334155; margin-bottom: 2px;">Termes et conditions</div>
          <ul style="margin: 0; padding-left: 12px;">
            <li>Tangaly Shipping n&apos;est pas responsable des articles interdits ou illégaux.</li>
            <li>Tangaly Shipping n&apos;est pas responsable des dommages dus à un mauvais emballage.</li>
            <li>Délai de livraison estimé : 5–10 jours ouvrables.</li>
          </ul>
        </div>
      </div>

      <div style="text-align: center; margin-top: 8px; font-size: 8px; color: #94a3b8;">
        <strong style="color: #1d4ed8;">Tangaly Shipping &amp; Logistics</strong> · Rapide, fiable et sécurisé · Fast, reliable &amp; secure<br />
        Merci de votre confiance · Thank you for your trust
      </div>
    </div>
  `;
}
