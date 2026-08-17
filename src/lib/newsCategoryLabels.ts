const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  'Tecnologia & IA': { en: 'Technology & AI', es: 'Tecnología e IA', fr: 'Technologie et IA' },
  'Big Tech & Plataformas': { en: 'Big Tech & Platforms', es: 'Big Tech y Plataformas', fr: 'Big Tech et Plateformes' },
  'SEO & Marketing Digital': { en: 'SEO & Digital Marketing', es: 'SEO y Marketing Digital', fr: 'SEO et Marketing Digital' },
  'E-commerce & Retalho Online': { en: 'eCommerce & Online Retail', es: 'eCommerce y Retail Online', fr: 'eCommerce et Commerce en Ligne' },
  'Mercados Financeiros & Cripto': { en: 'Financial Markets & Crypto', es: 'Mercados Financieros y Cripto', fr: 'Marchés Financiers et Crypto' },
  'Startups & Inovação em África': { en: 'Startups & Innovation in Africa', es: 'Startups e Innovación en África', fr: 'Startups et Innovation en Afrique' },
  'Geopolítica & Comércio Global': { en: 'Geopolitics & Global Trade', es: 'Geopolítica y Comercio Global', fr: 'Géopolitique et Commerce Mondial' },
  'Privacidade & Regulação Digital': { en: 'Privacy & Digital Regulation', es: 'Privacidad y Regulación Digital', fr: 'Confidentialité et Régulation Numérique' },
};

export function getCategoryLabel(category: string, language: string): string {
  if (language === 'pt') return category;
  return CATEGORY_LABELS[category]?.[language] || category;
}