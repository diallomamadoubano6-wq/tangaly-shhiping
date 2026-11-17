export interface SiteContactInfo {
  email: string;
  phoneUSA: string;
  phoneGN: string;
  whatsapp: string;
  addressUSA: string;
  addressGN: string;
  horaires: string;
  facebook?: string;
  instagram?: string;
}

export const DEFAULT_CONTACT_INFO: SiteContactInfo = {
  email: 'contact@tangalyshipping.com',
  phoneUSA: '+1 (646) 382-0065',
  phoneGN: '+224 626 98 52 54',
  whatsapp: '+1 (646) 382-0065',
  addressUSA: '3429 3rd Ave, Bronx, NY 10456 (Hub USA)',
  addressGN: 'Cité Enco 5, Conakry, Guinée (Hub Conakry)',
  horaires: 'Lundi – Samedi : 8h00 – 20h00',
  facebook: 'https://www.facebook.com/tangalyshipping',
  instagram: 'https://www.instagram.com/tangalyshipping',
};

