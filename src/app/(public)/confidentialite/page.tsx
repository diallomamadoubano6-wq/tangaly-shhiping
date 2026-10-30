import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Eye, Database, Share2, Shield, UserCheck, Cookie, RefreshCw, Mail, PhoneCall } from 'lucide-react';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | TANGALY Shipping & Logistics',
  description: 'Découvrez comment TANGALY Shipping & Logistics protège et traite vos données personnelles lors de vos expéditions de fret aérien et maritime entre les USA et la Guinée.',
};

export default function ConfidentialitePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.badge}>
            <Lock size={14} /> Protection de la Vie Privée &amp; Données Personnelles
          </div>
          <h1 className={styles.heroTitle}>Politique de Confidentialité</h1>
          <p className={styles.heroSubtitle}>
            Votre confiance est notre priorité. Découvrez comment TANGALY collecte, utilise et protège vos données lors de chaque expédition.
          </p>
          <div className={styles.heroMeta}>
            <span>Dernière mise à jour : 30 Octobre 2026</span>
            <span>•</span>
            <span>Conforme aux normes de protection internationales</span>
          </div>
        </div>
      </section>

      <main className={styles.contentWrapper}>
        <div className={styles.card}>

          {/* Section 1 : Introduction */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Shield size={20} />
              </div>
              <h2 className={styles.sectionTitle}>1. Introduction &amp; Responsable du Traitement</h2>
            </div>
            <p className={styles.paragraph}>
              Dans le cadre de ses activités de transport international de fret aérien et maritime entre les États-Unis et la République de Guinée, <strong>TANGALY Shipping &amp; Logistics LLC</strong> (avec sa filiale guinéenne <strong>TANGALY Express Logistics SARL</strong>) est amenée à collecter et traiter des données à caractère personnel vous concernant.
            </p>
            <p className={styles.paragraph}>
              La présente Politique de Confidentialité a pour objet de vous expliquer en toute transparence la nature des informations recueillies, l&apos;usage qui en est fait, les mesures mises en place pour assurer leur sécurité ainsi que vos droits légaux.
            </p>
          </section>

          {/* Section 2 : Données collectées */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Database size={20} />
              </div>
              <h2 className={styles.sectionTitle}>2. Quelles Données Collectons-nous ?</h2>
            </div>
            <p className={styles.paragraph}>
              Nous ne collectons que les données strictement nécessaires à l&apos;acheminement de vos colis, à la facturation et à la conformité douanière :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Données d&apos;identification de l&apos;expéditeur :</strong> Nom, prénom, numéro de téléphone, adresse postale (USA ou Guinée), adresse email.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Données du destinataire :</strong> Nom complet, numéro de téléphone de contact pour la livraison, ville et quartier de destination (Conakry, Labé, Kindia, Mamou, etc.).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Informations sur le colis et le fret :</strong> Description du contenu des marchandises, poids (kg), dimensions/volume, valeur déclarée pour les assurances et les douanes, numéro de suivi (tracking number).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Données de transaction &amp; facturation :</strong> Montant du fret, acomptes versés, soldes restants, mode de règlement (Espèces, Zelle, Orange Money, virement), reçus officiels émis.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Données techniques de connexion :</strong> Adresse IP, identifiants de session sécurisée, journal d&apos;audit des scans QR codes pour la traçabilité.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 : Finalités */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Eye size={20} />
              </div>
              <h2 className={styles.sectionTitle}>3. Pourquoi Utilisons-nous vos Données ?</h2>
            </div>
            <p className={styles.paragraph}>
              Le traitement de vos données répond à des finalités claires et légitimes :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Exécution de la prestation de transport :</strong> Enregistrement du colis, étiquetage QR code, groupage, acheminement aérien/maritime et livraison finale.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Suivi en temps réel &amp; Notifications :</strong> Envoi d&apos;alertes par SMS, WhatsApp ou Email lors des étapes clés (Colis reçu à New York, En transit, Arrivé à Conakry, Disponible en agence).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Obligations douanières et réglementaires :</strong> Préparation des manifestes d&apos;expédition pour les services des douanes américaines (CBP) et guinéennes.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Gestion de la relation client &amp; Facturation :</strong> Émission des reçus légaux, service après-vente, gestion des réclamations et assistance.</span>
              </li>
            </ul>
          </section>

          {/* Section 4 : Partage */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Share2 size={20} />
              </div>
              <h2 className={styles.sectionTitle}>4. Partage &amp; Non-commercialisation des Données</h2>
            </div>
            <div className={styles.infoBox}>
              <div className={styles.infoBoxTitle}>
                <Shield size={16} color="#2563eb" /> Engagement d&apos;intégrité TANGALY
              </div>
              <p style={{ margin: 0, fontSize: '0.925rem', color: '#1e293b' }}>
                <strong>Nous ne vendons, ne louons et ne cédons AUCUNE de vos données personnelles à des tiers à des fins publicitaires ou de prospection commerciale.</strong>
              </p>
            </div>
            <p className={styles.paragraph}>
              Vos données ne sont transmises qu&apos;aux destinataires strictement nécessaires à l&apos;exécution du service :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Nos agents habilités :</strong> Équipes opérationnelles situées dans nos agences (Hub New York, Siège Conakry, Agences régionales).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Compagnies de transport partenaires :</strong> Lignes aériennes et compagnies maritimes assurant la liaison internationale USA–Guinée.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Autorités publiques et douanières :</strong> Uniquement lorsque la loi l&apos;exige (contrôles de sécurité aéroportuaire, dédouanement officiel).</span>
              </li>
            </ul>
          </section>

          {/* Section 5 : Sécurité */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Lock size={20} />
              </div>
              <h2 className={styles.sectionTitle}>5. Sécurité &amp; Confidentialité des Systèmes</h2>
            </div>
            <p className={styles.paragraph}>
              TANGALY met en œuvre des mesures techniques et organisationnelles de pointe pour protéger vos données contre tout accès non autorisé, perte, divulgation ou altération :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Protocole SSL/TLS chiffré :</strong> Toutes les communications entre votre navigateur et notre plateforme sont entièrement chiffrées en HTTPS.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Mots de passe sécurisés :</strong> Chiffrement robuste avec sel (bcrypt) et prise en charge des clés d&apos;accès biométriques (Passkeys / WebAuthn).</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Contrôle d&apos;accès basé sur les rôles (RBAC) :</strong> Seuls les agents et administrateurs dûment autorisés ont accès aux fiches de colis pour leurs opérations.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Sauvegardes régulières :</strong> Sauvegardes automatisées et redondantes pour prévenir toute perte fortuite d&apos;informations.</span>
              </li>
            </ul>
          </section>

          {/* Section 6 : Conservation */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <RefreshCw size={20} />
              </div>
              <h2 className={styles.sectionTitle}>6. Durée de Conservation des Données</h2>
            </div>
            <p className={styles.paragraph}>
              Vos données sont conservées pendant la durée nécessaire à l&apos;exécution du contrat de transport et au suivi post-livraison. Les données comptables et factures sont conservées pendant les délais légaux imposés par le droit commercial et fiscal (généralement 5 à 10 ans selon les législations applicables aux USA et en Guinée).
            </p>
          </section>

          {/* Section 7 : Vos droits */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <UserCheck size={20} />
              </div>
              <h2 className={styles.sectionTitle}>7. Vos Droits Concernant vos Données</h2>
            </div>
            <p className={styles.paragraph}>
              Vous disposez de l&apos;ensemble des droits prévus par les réglementations en vigueur :
            </p>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Droit d&apos;accès :</strong> Connaître les données personnelles que nous détenons à votre sujet.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Droit de rectification :</strong> Corriger vos coordonnées téléphoniques, adresses ou orthographe de vos noms.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Droit à l&apos;effacement :</strong> Demander la suppression de vos données, sous réserve de nos obligations légales d&apos;archivage fiscal et douanier.</span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.listBullet} />
                <span><strong>Droit d&apos;opposition :</strong> Vous opposer à la réception de notifications facultatives ou de newsletters d&apos;information.</span>
              </li>
            </ul>
          </section>

          {/* Section 8 : Cookies */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Cookie size={20} />
              </div>
              <h2 className={styles.sectionTitle}>8. Cookies &amp; Traceurs</h2>
            </div>
            <p className={styles.paragraph}>
              Notre site utilise uniquement des cookies strictement nécessaires au fonctionnement technique de la plateforme (gestion de la session utilisateur, maintien de la connexion sécurisée, mémorisation de la devise préférée USD/GNF). Nous n&apos;utilisons aucun cookie de ciblage publicitaire invasif.
            </p>
          </section>

          {/* Section 9 : Contact DPO */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrap}>
                <Mail size={20} />
              </div>
              <h2 className={styles.sectionTitle}>9. Contact du Délégué à la Protection des Données</h2>
            </div>
            <p className={styles.paragraph}>
              Pour toute question relative à cette politique de confidentialité ou pour exercer vos droits, vous pouvez contacter notre service dédié :
            </p>
            <div className={styles.infoBox}>
              <p style={{ margin: 0, fontSize: '0.925rem', color: '#1e293b' }}>
                <strong>Délégué à la Protection des Données — TANGALY Shipping</strong><br />
                <Mail size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Email : <a href="mailto:privacy@tangalylogistics.com" style={{ color: '#2563eb', textDecoration: 'underline' }}>privacy@tangalylogistics.com</a> ou <a href="mailto:contact@tangaly.com" style={{ color: '#2563eb', textDecoration: 'underline' }}>contact@tangaly.com</a><br />
                <PhoneCall size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Téléphone : +1 (234) 567-890 / +224 620 00 00 00
              </p>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
