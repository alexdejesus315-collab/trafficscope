import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';
import { useLanguage } from '../context/LanguageContext';

export default function Sobre() {
  const { t } = useLanguage();

  return (
    <CompanyPagePanel title={t('about.title')}>
      <p>{t('about.p1')}</p>
      <p>{t('about.p2')}</p>
      <p>{t('about.p3')}</p>
    </CompanyPagePanel>
  );
}