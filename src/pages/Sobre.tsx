import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';
import { useLanguage } from '../context/LanguageContext';

export default function Sobre() {
  const { t } = useLanguage();

  return (
    <CompanyPagePanel title={t('about.title')}>
      <section className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{t('about.p1')}</p>
      </section>
      <section className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{t('about.p2')}</p>
      </section>
      <section className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{t('about.p3')}</p>
      </section>
    </CompanyPagePanel>
  );
}