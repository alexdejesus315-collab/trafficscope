import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';
import { useLanguage } from '../context/LanguageContext';

export default function TermosDeUso() {
  const { t } = useLanguage();

  return (
    <CompanyPagePanel title={t('terms.title')}>
      <p className="text-[11px] text-muted-foreground -mt-2">{t('terms.lastUpdated')}</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t('terms.section1.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('terms.section1.text')}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t('terms.section2.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('terms.section2.text')}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t('terms.section3.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('terms.section3.text')}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t('terms.section4.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('terms.section4.text')}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t('terms.section5.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('terms.section5.text')}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t('terms.section6.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('terms.section6.text')}</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t('terms.section7.title')}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t('terms.section7.text')}</p>
      </section>
    </CompanyPagePanel>
  );
}