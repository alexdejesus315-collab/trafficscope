import React, { useEffect, useRef, useState } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import {
  Activity,
  ArrowRight,
  Bell,
  Layers,
  BarChart3,
  History,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Globe,
  Zap,
  ShieldCheck,
  GitCompare,
  MousePointerClick,
  Sparkles,
  FlaskConical,
} from "lucide-react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Logo({ dark = false }) {
  return (
    <a href="/" className="flex items-center gap-2.5 w-fit hover:opacity-80 transition-opacity">
      <div className="h-8 w-8 rounded-lg bg-slate-950 flex items-center justify-center shrink-0">
        <Activity className="h-4 w-4 text-white" />
      </div>
      <div className="leading-none">
        <div
          className={`font-semibold tracking-[0.18em] text-[13px] ${
            dark ? "text-white" : "text-slate-950"
          }`}
        >
          TRAFFICSCOPE
        </div>
      </div>
    </a>
  );
}

function NavBar() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 border-b ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-slate-100 shadow-sm"
          : "bg-white/60 backdrop-blur-md border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 text-[14px] text-slate-600">
          <a href="#produto" className="rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('landing.nav.product')}</a>
          <a href="#comparar" className="rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('landing.nav.compare')}</a>
          <a href="#precos" className="rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('landing.nav.pricing')}</a>
          <a href="/blog" className="rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('landing.nav.blog')}</a>
          <a href="/noticias" className="rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200">{t('landing.nav.news')}</a>
        </nav>
        <div className="flex items-center gap-3">
  <LanguageSwitcher />
  <a href="/login" className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-[14px] font-medium pl-3 pr-4 py-2 rounded-full shadow-sm transition-all hover:shadow-md hover:-translate-y-px active:translate-y-0">
    <svg className="h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24 C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
    {t('landing.nav.signup')}
  </a>
</div>
      </div>
    </header>
  );
}

function MiniCompareDemo() {
  const { t } = useLanguage();
  const domains = [
    { d: "amazon.com", v: "2.450.000.000", w: 96, grow: "+12.4%", up: true },
    { d: "x.com", v: "86.495.700", w: 34, grow: "+30.4%", up: true },
    { d: "google.com", v: "56.628.720", w: 28, grow: "-2.6%", up: false },
  ];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/40 p-5 w-full max-w-md backdrop-blur-sm">
      <div className="flex items-center gap-2 text-slate-400 text-[12px] mb-5">
        <GitCompare className="h-3.5 w-3.5" />
        <span>
          {t('landing.hero.demo.label')}
        </span>
      </div>
      <div className="space-y-4">
        {domains.map((r) => (
          <div key={r.d}>
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <span className="text-slate-700 font-medium">
                {r.d}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                    r.up
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  }`}
                >
                  {r.grow}
                </span>
                <span className="text-slate-400 text-[12px]">{r.v} {t('landing.hero.demo.visitsPerMonth')}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-700 transition-all duration-1000 ease-out"
                style={{ width: `${r.w}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
        <span>{t('landing.hero.demo.primaryChannel')}</span>
        <span className="text-slate-600 font-medium">{t('landing.hero.demo.channels')}</span>
      </div>
    </div>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-[#FAFAFA]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-rose-100/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[12px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full mb-6">
            <Activity className="h-3.5 w-3.5" />
            {t('landing.hero.badge')}
          </div>
          <h1 className="text-[40px] sm:text-[52px] leading-[1.05] font-semibold text-slate-950 tracking-tight mb-5">
            {t('landing.hero.title')}
          </h1>
          <p className="text-[17px] text-slate-600 leading-relaxed mb-8 max-w-md">
            {t('landing.hero.subtitle')}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/login" className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-medium px-6 py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-700/20 hover:-translate-y-0.5 active:translate-y-0">
              {t('landing.hero.ctaPrimary')} <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#comparar" className="inline-flex items-center gap-2 text-slate-700 font-medium px-6 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-white transition-all">
              {t('landing.hero.ctaSecondary')}
            </a>
          </div>
          <p className="text-[12px] text-slate-400 mt-4">
            {t('landing.hero.footnote')}
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <MiniCompareDemo />
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const { t } = useLanguage();
  const stats = [
    { n: "1,2M+", l: t('landing.stats.domains') },
    { n: "48", l: t('landing.stats.countries') },
    { n: "230K+", l: t('landing.stats.reports') },
  ];
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className="bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-3 gap-6 text-center">
        {stats.map((s, i) => (
          <div
            key={s.l}
            className={`transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <div className="text-[28px] sm:text-[36px] font-semibold text-slate-950">
              {s.n}
            </div>
            <div className="text-[13px] text-slate-500 mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const { t } = useLanguage();
  const items = [
    {
      icon: GitCompare,
      title: t('landing.features.compare.title'),
      desc: t('landing.features.compare.desc'),
    },
    {
      icon: BarChart3,
      title: t('landing.features.traffic.title'),
      desc: t('landing.features.traffic.desc'),
    },
    {
      icon: Layers,
      title: t('landing.features.tech.title'),
      desc: t('landing.features.tech.desc'),
    },
    {
      icon: Bell,
      title: t('landing.features.alerts.title'),
      desc: t('landing.features.alerts.desc'),
    },
    {
      icon: History,
      title: t('landing.features.history.title'),
      desc: t('landing.features.history.desc'),
    },
    {
      icon: Sparkles,
      title: t('landing.features.ai.title'),
      desc: t('landing.features.ai.desc'),
    },
  ];

  const { ref, visible } = useReveal();

  return (
    <section id="produto" className="max-w-6xl mx-auto px-6 py-20">
      <div
        ref={ref}
        className={`max-w-xl mb-14 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <h2 className="text-[30px] font-semibold text-slate-950 mb-3">
          {t('landing.features.title')}
        </h2>
        <p className="text-slate-600 text-[17px] leading-relaxed">
          {t('landing.features.subtitle')}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it, i) => (
          <div
            key={it.title}
            className={`group p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/30 transition-all duration-500 hover:-translate-y-1 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
              <it.icon className="h-5 w-5 text-blue-700" />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-950 mb-2">
              {it.title}
            </h3>
            <p className="text-[14px] text-slate-500 leading-relaxed">
              {it.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompareShowcase() {
  const { t } = useLanguage();
  const { ref, visible } = useReveal();

  const competitors = [
    {
      domain: "amazon.com",
      visits: "2.45B",
      growth: "+12.4%",
      up: true,
      primary: t('landing.compareShowcase.channel.direct'),
      share: 56.4,
      pages: "8.6",
      time: "7m 14s",
      bounce: "34.2%",
    },
    {
      domain: "x.com",
      visits: "86.5M",
      growth: "+30.4%",
      up: true,
      primary: t('landing.compareShowcase.channel.organic'),
      share: 45,
      pages: "3.0",
      time: "3m 47s",
      bounce: "35.0%",
    },
    {
      domain: "google.com",
      visits: "56.6M",
      growth: "-2.6%",
      up: false,
      primary: t('landing.compareShowcase.channel.organic'),
      share: 45,
      pages: "4.7",
      time: "5m 34s",
      bounce: "36.0%",
    },
  ];

  return (
    <section
      id="comparar"
      ref={ref}
      className="bg-slate-950 py-20 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div
          className={`max-w-xl mb-14 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="text-[12px] font-medium text-blue-400 uppercase tracking-widest mb-3">
            {t('landing.compareShowcase.label')}
          </div>
          <h2 className="text-[30px] font-semibold text-white mb-3">
            {t('landing.compareShowcase.title')}
          </h2>
          <p className="text-slate-400 text-[17px] leading-relaxed">
            {t('landing.compareShowcase.subtitle')}
          </p>
        </div>

        <div
          className={`bg-white rounded-2xl border border-slate-800 overflow-hidden shadow-2xl transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">{t('landing.compareShowcase.table.domain')}</div>
            <div className="col-span-2 text-right">{t('landing.compareShowcase.table.monthlyTraffic')}</div>
            <div className="col-span-2 text-right">{t('landing.compareShowcase.table.growth')}</div>
            <div className="col-span-2 text-right">{t('landing.compareShowcase.table.primaryChannel')}</div>
            <div className="col-span-3 text-right hidden sm:block">{t('landing.compareShowcase.table.engagement')}</div>
          </div>

          {competitors.map((c, i) => (
            <div
              key={c.domain}
              className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-slate-50 last:border-0 items-center hover:bg-slate-50/50 transition-colors"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="col-span-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-slate-600" />
                </div>
                <span className="text-slate-900 font-medium text-[14px]">
                  {c.domain}
                </span>
              </div>
              <div className="col-span-2 text-right text-slate-900 font-semibold text-[14px]">
                {c.visits}
              </div>
              <div className="col-span-2 text-right">
                <span
                  className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-1 rounded-full ${
                    c.up
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-700 bg-rose-50"
                  }`}
                >
                  {c.up ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {c.growth}
                </span>
              </div>
              <div className="col-span-2 text-right text-[13px] text-slate-600">
                {c.primary} ({c.share}%)
              </div>
              <div className="col-span-3 text-right hidden sm:block text-[12px] text-slate-500">
                {c.time} · {c.pages} {t('landing.compareShowcase.pagesAbbr')} · {c.bounce} {t('landing.compareShowcase.bounceLabel')}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a href="/login" className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-medium px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-700/25 hover:-translate-y-0.5">
            <MousePointerClick className="h-4 w-4" />
            {t('landing.compareShowcase.cta')}
          </a>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useLanguage();
  const { ref, visible } = useReveal();

  return (
    <section id="precos" className="max-w-6xl mx-auto px-6 py-20">
      <div
        ref={ref}
        className={`max-w-lg mx-auto text-center mb-14 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <h2 className="text-[30px] font-semibold text-slate-950 mb-3">
          {t('landing.pricing.title')}
        </h2>
        <p className="text-slate-600 text-[17px] leading-relaxed">
          {t('landing.pricing.subtitle')}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div
          className={`rounded-2xl p-8 border border-slate-100 bg-white hover:border-slate-200 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/20 hover:-translate-y-1 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full mb-5">
            <FlaskConical className="h-3.5 w-3.5" />
            {t('landing.pricing.test.badge')}
          </div>
          <div className="text-[32px] font-semibold text-slate-950 mb-2">
            {t('landing.pricing.test.price')}
          </div>
          <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
            {t('landing.pricing.test.desc')}
          </p>
          <ul className="space-y-3 mb-8">
            {[
              t('landing.pricing.test.feature1'),
              t('landing.pricing.test.feature2'),
              t('landing.pricing.test.feature3'),
              t('landing.pricing.test.feature4'),
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-[14px] text-slate-600">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <a href="/login" className="block text-center font-medium px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-all">
            {t('landing.pricing.test.cta')}
          </a>
        </div>

        <div
          className={`relative rounded-2xl p-8 border-2 border-blue-700 bg-blue-50/30 transition-all duration-500 hover:shadow-xl hover:shadow-blue-700/10 hover:-translate-y-1 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-[11px] font-bold px-3 py-1 rounded-full">
            {t('landing.pricing.real.popular')}
          </div>

          <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full mb-5">
            <Activity className="h-3.5 w-3.5" />
            {t('landing.pricing.real.badge')}
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-[32px] font-semibold text-slate-950">
              2€
            </span>
            <span className="text-slate-500 text-[14px]">{t('landing.pricing.real.priceSuffix')}</span>
          </div>
          <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
            {t('landing.pricing.real.desc')}
          </p>
          <ul className="space-y-3 mb-8">
            {[
              t('landing.pricing.real.feature1'),
              t('landing.pricing.real.feature2'),
              t('landing.pricing.real.feature3'),
              t('landing.pricing.real.feature4'),
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-[14px] text-slate-700">
                <ShieldCheck className="h-4 w-4 text-blue-700 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <a href="/login" className="block text-center font-medium px-4 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white transition-all hover:shadow-lg hover:shadow-blue-700/25">
            {t('landing.pricing.real.cta')}
          </a>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const { t } = useLanguage();
  const { ref, visible } = useReveal();
  return (
    <section className="relative overflow-hidden bg-[#FAFAFA]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-100/50 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
        <div
          ref={ref}
          className={`transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-700 text-white mb-6 shadow-lg shadow-blue-700/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-[32px] font-semibold text-slate-950 mb-4">
            {t('landing.finalCta.title')}
          </h2>
          <p className="text-slate-600 mb-10 max-w-md mx-auto text-[17px] leading-relaxed">
            {t('landing.finalCta.subtitle')}
          </p>
          <a href="/login" className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-medium px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-700/20 hover:-translate-y-0.5 active:translate-y-0">
            {t('landing.finalCta.cta')} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <NavBar />
      <Hero />
      <StatsBar />
      <Features />
      <CompareShowcase />
      <Pricing />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}