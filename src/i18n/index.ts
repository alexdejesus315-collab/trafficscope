import { pt } from './locales/pt';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import type { Language } from '../context/LanguageContext';

export type TranslationKey = keyof typeof pt;

export const translations: Record<Language, Record<string, string>> = {
  pt,
  en,
  es,
  fr,
};