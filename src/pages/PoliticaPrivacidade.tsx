import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';
import { useLanguage } from '../context/LanguageContext';

export default function PoliticaPrivacidade() {
  const { t } = useLanguage();

  return (
    <CompanyPagePanel title={t('privacy.title')}>
      <p className="text-[11px] text-muted-foreground -mt-2">{t('privacy.lastUpdated')}</p>

      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('privacy.section1.title')}</h2>
        <p>{t('privacy.section1.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('privacy.section2.title')}</h2>
        <p>{t('privacy.section2.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('privacy.section3.title')}</h2>
        <p>{t('privacy.section3.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('privacy.section4.title')}</h2>
        <p>{t('privacy.section4.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('privacy.section5.title')}</h2>
        <p>{t('privacy.section5.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('privacy.section6.title')}</h2>
        <p>{t('privacy.section6.text')}</p>
      </section>
    </CompanyPagePanel>
  );
}