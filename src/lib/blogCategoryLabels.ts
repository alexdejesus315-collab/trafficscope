const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  'E-commerce Global': { en: 'Global eCommerce', es: 'eCommerce Global', fr: 'eCommerce Mondial' },
  'Streaming & Entretenimento': { en: 'Streaming & Entertainment', es: 'Streaming y Entretenimiento', fr: 'Streaming et Divertissement' },
  'Fintech & Pagamentos': { en: 'Fintech & Payments', es: 'Fintech y Pagos', fr: 'Fintech et Paiements' },
  'Redes Sociais': { en: 'Social Media', es: 'Redes Sociales', fr: 'Réseaux Sociaux' },
  'Viagens & Turismo': { en: 'Travel & Tourism', es: 'Viajes y Turismo', fr: 'Voyages et Tourisme' },
  'Entrega & Mobilidade': { en: 'Delivery & Mobility', es: 'Entrega y Movilidad', fr: 'Livraison et Mobilité' },
  'Produtividade & SaaS': { en: 'Productivity & SaaS', es: 'Productividad y SaaS', fr: 'Productivité et SaaS' },
  'Tecnologia': { en: 'Technology', es: 'Tecnología', fr: 'Technologie' },
  'Mercados Financeiros': { en: 'Financial Markets', es: 'Mercados Financieros', fr: 'Marchés Financiers' },
  'Geopolítica & Economia Global': { en: 'Geopolitics & Global Economy', es: 'Geopolítica y Economía Global', fr: 'Géopolitique et Économie Mondiale' },
  'Startups & Inovação em África': { en: 'Startups & Innovation in Africa', es: 'Startups e Innovación en África', fr: 'Startups et Innovation en Afrique' },
  'China-América & Comércio Global': { en: 'China-US & Global Trade', es: 'China-EE. UU. y Comercio Global', fr: 'Chine-États-Unis et Commerce Mondial' },
  'Criptomoedas': { en: 'Cryptocurrencies', es: 'Criptomonedas', fr: 'Cryptomonnaies' },
  'Moda & Arte': { en: 'Fashion & Art', es: 'Moda y Arte', fr: 'Mode et Art' },
};

export function getBlogCategoryLabel(category: string, language: string): string {
  if (language === 'pt') return category;
  return CATEGORY_LABELS[category]?.[language] || category;
}