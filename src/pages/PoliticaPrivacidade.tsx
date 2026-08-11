import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';
import { useLanguage } from '../context/LanguageContext';

export default function PoliticaPrivacidade() {
  const { t } = useLanguage();

  return (
    <CompanyPagePanel title={t('privacy.title')}>
      <p className="text-[11px] text-muted-foreground -mt-2 mb-4">{t('privacy.lastUpdated')}</p>

      {[1, 2, 3, 4, 5, 6].map((num) => (
        <section key={num}>
          <h2>{t(`privacy.section${num}.title`)}</h2>
          <p>{t(`privacy.section${num}.text`)}</p>
        </section>
      ))}
    </CompanyPagePanel>
  );
}