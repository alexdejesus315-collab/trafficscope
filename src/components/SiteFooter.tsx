import React from "react";
import { Activity, Twitter, Linkedin, Instagram } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

function FooterLogo() {
  return (
    <a href="/" className="flex items-center gap-2.5 w-fit hover:opacity-80 transition-opacity">
      <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
        <Activity className="h-4 w-4 text-slate-950" />
      </div>
      <div className="leading-none">
        <div className="font-semibold tracking-[0.18em] text-[13px] text-white">
          TRAFFICSCOPE
        </div>
      </div>
    </a>
  );
}

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="relative bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-14 grid sm:grid-cols-2 md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <FooterLogo />
          <p className="text-[13px] text-slate-400 mt-4 max-w-[240px] leading-relaxed">
            {t('footer.tagline')}
          </p>
          <div className="flex items-center gap-3 mt-6">
            {[Twitter, Linkedin, Instagram].map((Icon, idx) => (
              <a key={idx} href="#" className="h-9 w-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:!bg-primary/20 hover:!text-primary hover:border-white/20 transition-all duration-200">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
            {t('footer.product')}
          </div>
          <ul className="space-y-2.5 text-[14px] text-slate-400">
            <li><a href="/#produto" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.features')}</a></li>
            <li><a href="/#comparar" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.compare')}</a></li>
            <li><a href="/#precos" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.pricing')}</a></li>
          </ul>
        </div>

        <div>
          <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
            {t('footer.company')}
          </div>
          <ul className="space-y-2.5 text-[14px] text-slate-400">
            <li><a href="/sobre" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.about')}</a></li>
            <li><a href="/blog" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.blog')}</a></li>
            <li><a href="/noticias" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.news')}</a></li>
            <li><a href="/suporte" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.support')}</a></li>
          </ul>
        </div>

        <div>
          <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-4">
            {t('footer.legal')}
          </div>
          <ul className="space-y-2.5 text-[14px] text-slate-400">
            <li><a href="/faq" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.faq')}</a></li>
            <li><a href="/politica-privacidade" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.privacy')}</a></li>
            <li><a href="/termos-de-uso" className="inline-block -ml-3 rounded-full px-3 py-1 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('footer.terms')}</a></li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-500">
          <span>{t('footer.copyright')}</span>
          <span>{t('footer.slogan')}</span>
        </div>
      </div>
    </footer>
  );
}