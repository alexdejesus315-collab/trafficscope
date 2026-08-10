import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';
import { useLanguage } from '../context/LanguageContext';

export default function TermosDeUso() {
  const { t } = useLanguage();

  return (
    <CompanyPagePanel title={t('terms.title')}>
      <p className="text-[11px] text-muted-foreground -mt-2">{t('terms.lastUpdated')}</p>

      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('terms.section1.title')}</h2>
        <p>{t('terms.section1.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('terms.section2.title')}</h2>
        <p>{t('terms.section2.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('terms.section3.title')}</h2>
        <p>{t('terms.section3.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('terms.section4.title')}</h2>
        <p>{t('terms.section4.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('terms.section5.title')}</h2>
        <p>{t('terms.section5.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('terms.section6.title')}</h2>
        <p>{t('terms.section6.text')}</p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">{t('terms.section7.title')}</h2>
        <p>{t('terms.section7.text')}</p>
      </section>
    </CompanyPagePanel>
  );
}