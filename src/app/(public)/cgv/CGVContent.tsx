'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileCheck, Plane, Ship, AlertCircle, DollarSign, PackageCheck, ShieldAlert, PhoneCall, ShieldCheck, HelpCircle } from 'lucide-react';
import styles from '../legal.module.css';

export default function CGVContent() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.badge}>
            <FileCheck size={14} /> {lang === 'fr' ? 'Contrat de Transport & Conditions Générales' : 'Terms of Service & Carriage Contract'}
          </div>
          <h1 className={styles.heroTitle}>
            {lang === 'fr' ? 'Conditions Générales de Vente (CGV)' : 'Terms & Conditions of Carriage'}
          </h1>
          <p className={styles.heroSubtitle}>
            {lang === 'fr' 
              ? 'Règles et engagements mutuels régissant les opérations d’expédition aérienne et maritime entre les États-Unis et la Guinée.'
              : 'Rules and mutual obligations governing air and ocean freight shipping operations between the United States and Guinea.'}
          </p>

          <div className={styles.langSwitchWrap}>
            <button 
              type="button" 
              onClick={() => setLang('fr')}
              className={`${styles.langBtn} ${lang === 'fr' ? styles.langBtnActive : ''}`}
            >
              🇫🇷 Version Française
            </button>
            <button 
              type="button" 
              onClick={() => setLang('en')}
              className={`${styles.langBtn} ${lang === 'en' ? styles.langBtnActive : ''}`}
            >
              🇺🇸 English Version
            </button>
          </div>

          <div className={styles.heroMeta} style={{ marginTop: '1rem' }}>
            <span>{lang === 'fr' ? 'Dernière révision : Novembre 2026' : 'Last Updated: November 2026'}</span>
            <span>•</span>
            <span>{lang === 'fr' ? 'Applicable à tous les envois USA ↔ Guinée' : 'Applicable to all USA ↔ Guinea shipments'}</span>
          </div>
        </div>
      </section>

      <main className={styles.contentWrapper}>
        <div className={styles.card}>
          
          <div className={styles.bilingualNotice}>
            <HelpCircle size={18} />
            <div>
              <strong>{lang === 'fr' ? 'Document Bilingue Officiel :' : 'Official Bilingual Terms:'}</strong>{' '}
              {lang === 'fr' 
                ? 'Ces conditions s’appliquent à toutes les expéditions gérées par TANGALY Shipping & Logistics LLC (USA) et TANGALY Express Logistics SARL (Guinée).'
                : 'These terms apply to all shipments handled by TANGALY Shipping & Logistics LLC (USA) and TANGALY Express Logistics SARL (Guinea).'}
            </div>
          </div>

          {lang === 'fr' ? (
            /* =================== VERSION FRANCAISE =================== */
            <>
              {/* Article 1 */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><FileCheck size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 1 : Objet &amp; Identification des Parties</h2>
                </div>
                <p className={styles.paragraph}>
                  Les présentes Conditions Générales de Vente et de Transport régissent l&apos;ensemble des prestations d&apos;expédition, de groupage, de transit, d&apos;entreposage et de dédouanement fournies par le groupe <strong>TANGALY Shipping &amp; Logistics</strong> (comprenant <strong>TANGALY Shipping &amp; Logistics LLC</strong> enregistrée aux États-Unis et <strong>TANGALY Express Logistics SARL</strong> enregistrée au RCCM de la République de Guinée) au profit de tout client expéditeur ou destinataire.
                </p>
                <p className={styles.paragraph}>
                  Toute remise physique de colis, création d&apos;étiquette de suivi ou paiement d&apos;acompte vaut acceptation pleine, entière et sans réserve des présentes conditions générales.
                </p>
              </section>

              {/* Article 2 */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><Plane size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 2 : Prestations de Transport (Aérien &amp; Maritime)</h2>
                </div>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Fret Aérien Express (Air Freight) :</strong> Acheminement rapide par avion dans les deux sens (USA ➔ Guinée et Guinée ➔ USA). Délais indicatifs moyens : <strong>3 à 7 jours ouvrés</strong> après le départ effectif du vol. Facturation établie au poids réel (kg) ou au poids volumétrique conformément aux normes IATA.</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Fret Maritime Sécurisé (Ocean Freight) :</strong> Expéditions régulières par conteneurs maritimes pour marchandises volumineuses, colis lourds, barils et cartons commerciaux. Délais indicatifs moyens : <strong>30 à 45 jours</strong> après le départ du navire. Facturation calculée au volume (mètre cube - m³) ou au forfait carton standard.</span>
                  </li>
                </ul>
                <p className={styles.paragraph} style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  <em>Note : Les délais de livraison sont communiqués à titre indicatif et ne tiennent pas compte des retards imputables aux inspections des douanes, aux formalités portuaires/aéroportuaires ou aux cas de force majeure météo.</em>
                </p>
              </section>

              {/* Article 3 */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><DollarSign size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 3 : Tarifs, Facturation &amp; Modalités de Règlement</h2>
                </div>
                <p className={styles.paragraph}>
                  Les tarifs de référence sont libellés en <strong>Dollars Américains ($ USD)</strong> et peuvent être réglés en monnaie locale (Francs Guinéens - GNF) selon le taux de change officiel appliqué en agence le jour du paiement :
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Acompte et solde :</strong> Un acompte peut être versé lors de la prise en charge du colis aux USA ou en Guinée. Le solde total de la facture doit être impérativement réglé avant la délivrance finale du colis au destinataire.</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Moyens de paiement acceptés :</strong> Espèces (CASH en USD ou GNF), Zelle, Orange Money, virement bancaire. Un reçu officiel numérique ou imprimé comportant un numéro de bordereau et QR code est automatiquement généré.</span>
                  </li>
                </ul>
              </section>

              {/* Article 4 */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><ShieldAlert size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 4 : Marchandises Prohibées &amp; Responsabilité Douanière</h2>
                </div>
                <div className={`${styles.infoBox} ${styles.infoBoxWarning}`}>
                  <div className={styles.infoBoxTitle}>
                    <AlertCircle size={16} color="#d97706" /> Déclaration sous serment de l&apos;expéditeur
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e' }}>
                    Sont formellement interdits dans tous les envois : armes, munitions, matières explosives ou inflammables, drogues, stupéfiants, espèces monétaires non déclarées, marchandises de contrefaçon, produits périssables non conditionnés et tout article prohibé par la réglementation douanière des États-Unis ou de la République de Guinée.
                  </p>
                </div>
                <p className={styles.paragraph}>
                  L&apos;expéditeur est seul et unique responsable des déclarations de contenu qu&apos;il fournit. En cas de dissimulation ou de fausse déclaration, le client supportera l&apos;intégralité des amendes, saisies et poursuites pénales engagées par les autorités douanières.
                </p>
              </section>

              {/* Article 5 */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><PackageCheck size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 5 : Réception &amp; Retrait en Agence</h2>
                </div>
                <p className={styles.paragraph}>
                  Dès réception du colis au hub de Conakry ou New York, ou dans les agences relais (Labé, Mamou, Kindia, etc.), le destinataire est notifié par SMS, WhatsApp ou téléphone.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Pièce d&apos;identité obligatoire :</strong> La remise s&apos;effectue uniquement sur présentation d&apos;une pièce d&apos;identité officielle en cours de validité correspondant au nom mentionné sur le bordereau.</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Période de franchise gratuite :</strong> Les colis bénéficient d&apos;un gardiennage gratuit pendant <strong>15 jours calendaires</strong> à compter de la notification d&apos;arrivée. Au-delà, des frais de magasinage de 2 $ USD (ou équivalent GNF) par jour peuvent être facturés.</span>
                  </li>
                </ul>
              </section>

              {/* Article 6 - NOUVEL ARTICLE RESPONSABILITE ET PERTE */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><ShieldCheck size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 6 : Responsabilité, Indemnisation &amp; Assurance en cas de Perte ou Avarie</h2>
                </div>
                <p className={styles.paragraph}>
                  TANGALY Shipping &amp; Logistics garantit un suivi rigoureux par QR code à chaque étape du transit. En cas d&apos;incident exceptionnel durant l&apos;acheminement, les règles de responsabilité suivantes s&apos;appliquent obligatoirement :
                </p>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxTitle}>
                    <ShieldCheck size={16} color="#2563eb" /> 1. Indemnisation Standard Forfaitaire (sans assurance souscrite)
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.925rem', color: '#1e293b' }}>
                    Pour tout colis standard confié sans déclaration de valeur spécifique, en cas de perte totale avérée ou de détérioration directement imputable à TANGALY, l&apos;indemnisation est plafonnée à :
                  </p>
                  <ul className={styles.list} style={{ margin: '0.25rem 0' }}>
                    <li className={styles.listItem}>
                      <span className={styles.listBullet} />
                      <span><strong>Remboursement intégral des frais d&apos;expédition</strong> payés par le client pour le colis concerné.</span>
                    </li>
                    <li className={styles.listItem}>
                      <span className={styles.listBullet} />
                      <span><strong>Indemnité forfaitaire de 20 $ USD par kilogramme</strong> (ou contre-valeur en GNF), dans la limite stricte de <strong>200 $ USD par colis</strong>.</span>
                    </li>
                  </ul>
                </div>

                <div className={styles.infoBox} style={{ borderLeftColor: '#10b981', background: '#f0fdf4' }}>
                  <div className={styles.infoBoxTitle} style={{ color: '#065f46' }}>
                    <ShieldCheck size={16} color="#10b981" /> 2. Assurance Valeur Déclarée « Ad Valorem » (Recommandée pour appareils précieux)
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.925rem', color: '#064e3b' }}>
                    Pour les articles de grande valeur marchande (smartphones neufs, ordinateurs portables, bijoux, appareils électroniques, équipements industriels), le client a l&apos;obligation d&apos;opter pour l&apos;assurance valeur déclarée lors de l&apos;enregistrement du colis :
                  </p>
                  <ul className={styles.list} style={{ margin: '0.25rem 0' }}>
                    <li className={styles.listItem}>
                      <span className={styles.listBullet} style={{ background: '#10b981' }} />
                      <span style={{ color: '#064e3b' }}><strong>Prime d&apos;assurance :</strong> 5% de la valeur marchande déclarée (sur présentation de la facture d&apos;achat d&apos;origine).</span>
                    </li>
                    <li className={styles.listItem}>
                      <span className={styles.listBullet} style={{ background: '#10b981' }} />
                      <span style={{ color: '#064e3b' }}><strong>Indemnisation à 100% :</strong> En cas de perte ou dommage avéré, TANGALY rembourse <strong>l&apos;intégralité de la valeur déclarée</strong> ainsi que les frais d&apos;expédition.</span>
                    </li>
                  </ul>
                </div>

                <p className={styles.paragraph}>
                  <strong>Exclusions de responsabilité :</strong> TANGALY ne saurait être tenue pour responsable des dommages résultant d&apos;un emballage défectueux ou insuffisant réalisé par l&apos;expéditeur lui-même, de la casse d&apos;articles liquides ou verres non signalés comme fragiles, des cas de force majeure (tempêtes maritimes, incendie, guerre, émeutes) ou de toute saisie / confiscation légale par les douanes pour contenu non conforme.
                </p>
              </section>

              {/* Article 7 */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><PhoneCall size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 7 : Procédure de Réclamation &amp; Délais</h2>
                </div>
                <p className={styles.paragraph}>
                  Toute anomalie apparente (carton ouvert, traces de mouille, choc visible) doit impérativement faire l&apos;objet de <strong>réserves écrites circonstanciées</strong> portées sur le bordereau de livraison au moment précis du retrait en agence en présence de l&apos;agent.
                </p>
                <p className={styles.paragraph}>
                  Toute réclamation formelle doit être adressée par écrit dans un délai strict de <strong>48 heures ouvrées</strong> suivant la livraison à notre service litiges :
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Email :</strong> <a href="mailto:contact@tangalyshipping.com" style={{ color: '#2563eb', fontWeight: 600 }}>contact@tangalyshipping.com</a></span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Téléphone USA :</strong> +1 (646) 382-0065</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Téléphone Guinée :</strong> +224 626 98 52 54</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Pièces à joindre :</strong> Numéro de suivi (Tracking), copie du bordereau avec réserves, photos détaillées du colis et facture d&apos;achat d&apos;origine.</span>
                  </li>
                </ul>
              </section>
            </>
          ) : (
            /* =================== ENGLISH VERSION =================== */
            <>
              {/* Article 1 EN */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><FileCheck size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 1: Scope &amp; Identification of Parties</h2>
                </div>
                <p className={styles.paragraph}>
                  These General Terms and Conditions of Carriage govern all freight forwarding, shipping, warehousing, customs clearance, and courier services provided by <strong>TANGALY Shipping &amp; Logistics</strong> (comprising <strong>TANGALY Shipping &amp; Logistics LLC</strong> registered in the United States and <strong>TANGALY Express Logistics SARL</strong> registered under RCCM in the Republic of Guinea) to any sender or consignee.
                </p>
                <p className={styles.paragraph}>
                  Tendering cargo to TANGALY, creating a tracking airway bill, or paying a shipping deposit constitutes unconditional acceptance of these terms and conditions.
                </p>
              </section>

              {/* Article 2 EN */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><Plane size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 2: Shipping Services (Air &amp; Ocean Freight)</h2>
                </div>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Express Air Freight:</strong> Regular flights operating bilaterally (USA ➔ Guinea and Guinea ➔ USA). Average transit time: <strong>3 to 7 business days</strong> following flight departure. Billed by actual gross weight (kg) or volumetric weight under IATA standards.</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Secured Ocean Freight:</strong> Scheduled sea containers for heavy parcels, commercial boxes, barrels, and vehicles. Average transit time: <strong>30 to 45 calendar days</strong> following vessel departure. Billed by cubic meter (CBM / m³) or standard commercial box flat rate.</span>
                  </li>
                </ul>
                <p className={styles.paragraph} style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  <em>Note: Transit times are estimated and do not account for delays resulting from port/customs physical inspections, airline rescheduling, or weather conditions.</em>
                </p>
              </section>

              {/* Article 3 EN */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><DollarSign size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 3: Rates, Invoicing &amp; Payment Terms</h2>
                </div>
                <p className={styles.paragraph}>
                  Base tariffs are denominated in <strong>US Dollars ($ USD)</strong> and may be settled in local currency (Guinean Francs - GNF) based on the official company exchange rate applied on the payment date:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Deposit &amp; Final Balance:</strong> A deposit may be paid upon package intake in New York or Conakry. Full payment must be settled before final release of cargo to the consignee.</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Accepted Payment Methods:</strong> Cash (USD or GNF), Zelle, Orange Money, and Bank Transfer. An official digital or printed receipt with a QR code and tracking bill is issued for every transaction.</span>
                  </li>
                </ul>
              </section>

              {/* Article 4 EN */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><ShieldAlert size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 4: Dangerous Goods &amp; Customs Compliance</h2>
                </div>
                <div className={`${styles.infoBox} ${styles.infoBoxWarning}`}>
                  <div className={styles.infoBoxTitle}>
                    <AlertCircle size={16} color="#d97706" /> Mandatory Shipper Declaration
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e' }}>
                    The following are strictly prohibited in all shipments: firearms, ammunition, explosives, hazardous chemicals, illegal drugs, narcotics, undeclared cash, counterfeit goods, unpackaged perishables, and any contraband prohibited by US or Guinean law.
                  </p>
                </div>
                <p className={styles.paragraph}>
                  The shipper bears sole and complete legal liability for item declarations. In the event of fraudulent declaration or contraband concealment, the shipper shall indemnify TANGALY for all fines, seizures, and criminal sanctions imposed by customs authorities.
                </p>
              </section>

              {/* Article 5 EN */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><PackageCheck size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 5: Package Pick-up &amp; Delivery</h2>
                </div>
                <p className={styles.paragraph}>
                  Upon arrival at the Conakry or New York distribution hub, the consignee is notified by SMS, WhatsApp, or phone call.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Mandatory Government ID:</strong> Packages will only be released upon presentation of a valid photo identification matching the consignee name on the airway bill.</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Free Storage Allowance:</strong> Shipments are stored free of charge for <strong>15 calendar days</strong> following arrival notice. Thereafter, a storage fee of $2.00 USD (or equivalent GNF) per day may apply.</span>
                  </li>
                </ul>
              </section>

              {/* Article 6 EN - LIABILITY AND LOSS */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><ShieldCheck size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 6: Liability, Claims &amp; Cargo Insurance for Lost Parcels</h2>
                </div>
                <p className={styles.paragraph}>
                  TANGALY Shipping &amp; Logistics operates an end-to-end QR code tracking system. In the rare event of an incident during transportation, the following liability limits strictly apply:
                </p>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxTitle}>
                    <ShieldCheck size={16} color="#2563eb" /> 1. Standard Limited Liability (Without Declared Value Insurance)
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.925rem', color: '#1e293b' }}>
                    For standard packages shipped without declared value insurance, in the event of proven total loss or damage caused directly by TANGALY, compensation is strictly capped at:
                  </p>
                  <ul className={styles.list} style={{ margin: '0.25rem 0' }}>
                    <li className={styles.listItem}>
                      <span className={styles.listBullet} />
                      <span><strong>100% refund of the shipping fees</strong> paid by the customer for the affected package.</span>
                    </li>
                    <li className={styles.listItem}>
                      <span className={styles.listBullet} />
                      <span><strong>A standard flat indemnity of $20.00 USD per kilogram</strong> (or GNF equivalent), with a maximum total ceiling of <strong>$200.00 USD per package</strong>.</span>
                    </li>
                  </ul>
                </div>

                <div className={styles.infoBox} style={{ borderLeftColor: '#10b981', background: '#f0fdf4' }}>
                  <div className={styles.infoBoxTitle} style={{ color: '#065f46' }}>
                    <ShieldCheck size={16} color="#10b981" /> 2. Declared Value Cargo Insurance (Ad Valorem - Recommended for High-Value Goods)
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.925rem', color: '#064e3b' }}>
                    For valuable electronics (new smartphones, laptops, jewelry, luxury merchandise, industrial tools), the shipper must declare the commercial value and purchase optional cargo insurance at parcel drop-off:
                  </p>
                  <ul className={styles.list} style={{ margin: '0.25rem 0' }}>
                    <li className={styles.listItem}>
                      <span className={styles.listBullet} style={{ background: '#10b981' }} />
                      <span style={{ color: '#064e3b' }}><strong>Insurance Premium:</strong> 5% of the declared commercial invoice value (supported by original purchase invoice).</span>
                    </li>
                    <li className={styles.listItem}>
                      <span className={styles.listBullet} style={{ background: '#10b981' }} />
                      <span style={{ color: '#064e3b' }}><strong>100% Full Reimbursement:</strong> In the event of total loss or catastrophic damage, TANGALY refunds <strong>100% of the declared invoice value</strong> plus shipping fees.</span>
                    </li>
                  </ul>
                </div>

                <p className={styles.paragraph}>
                  <strong>Exclusions from Liability:</strong> TANGALY shall not be liable for loss or damage caused by inadequate or fragile self-packaging performed by the shipper, leakage of liquids, force majeure events (storms at sea, war, riots, lightning), or official customs confiscation due to illegal or improperly declared goods.
                </p>
              </section>

              {/* Article 7 EN */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIconWrap}><PhoneCall size={20} /></div>
                  <h2 className={styles.sectionTitle}>Article 7: Dispute Resolution &amp; Claim Notice Timeframe</h2>
                </div>
                <p className={styles.paragraph}>
                  Any visible package damage or missing seal must be <strong>recorded in writing on the delivery bill</strong> at the time of pick-up in the presence of a TANGALY representative.
                </p>
                <p className={styles.paragraph}>
                  Formal claims must be submitted in writing within <strong>48 business hours</strong> following pickup to our customer claims desk:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Email:</strong> <a href="mailto:contact@tangalyshipping.com" style={{ color: '#2563eb', fontWeight: 600 }}>contact@tangalyshipping.com</a></span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>USA Phone:</strong> +1 (646) 382-0065</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Guinea Phone:</strong> +224 626 98 52 54</span>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.listBullet} />
                    <span><strong>Required Documents:</strong> Tracking airway bill, photos of package condition, and original proof of purchase.</span>
                  </li>
                </ul>
              </section>
            </>
          )}

        </div>
      </main>
    </>
  );
}
