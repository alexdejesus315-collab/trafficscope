import React from "react";
import { Activity, Twitter, Linkedin, Instagram } from "lucide-react";

function FooterLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-slate-950 flex items-center justify-center shrink-0">
        <Activity className="h-4 w-4 text-white" />
      </div>
      <div className="leading-none">
        <div
          className="font-semibold tracking-[0.18em] text-[13px] text-slate-950"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          TRAFFICSCOPE
        </div>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-14 grid sm:grid-cols-2 md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <FooterLogo />
          <p className="text-[13px] text-slate-500 mt-4 max-w-[240px] leading-relaxed">
            Inteligência competitiva e análise de tráfego web para equipas
            que não gostam de adivinhar.
          </p>
          <div className="flex items-center gap-3 mt-6">
            {[Twitter, Linkedin, Instagram].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="h-9 w-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-950 hover:bg-slate-100 hover:border-slate-200 transition-all"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Produto
          </div>
          <ul className="space-y-2.5 text-[14px] text-slate-600">
            <li><a href="/#produto" className="hover:text-slate-950 transition-colors">Funcionalidades</a></li>
            <li><a href="/#comparar" className="hover:text-slate-950 transition-colors">Comparar</a></li>
            <li><a href="/#precos" className="hover:text-slate-950 transition-colors">Preços</a></li>
          </ul>
        </div>

        <div>
          <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Empresa
          </div>
          <ul className="space-y-2.5 text-[14px] text-slate-600">
            <li><a href="/sobre" className="hover:text-slate-950 transition-colors">Sobre</a></li>
            <li><a href="/blog" className="hover:text-slate-950 transition-colors">Blog</a></li>
            <li><a href="/noticias" className="hover:text-slate-950 transition-colors">Notícias</a></li>
            <li><a href="/suporte" className="hover:text-slate-950 transition-colors">Suporte</a></li>
          </ul>
        </div>

        <div>
          <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Legal
          </div>
          <ul className="space-y-2.5 text-[14px] text-slate-600">
            <li><a href="/faq" className="hover:text-slate-950 transition-colors">FAQ</a></li>
            <li><a href="/politica-privacidade" className="hover:text-slate-950 transition-colors">Privacidade</a></li>
            <li><a href="/termos-de-uso" className="hover:text-slate-950 transition-colors">Termos</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-slate-400">
          <span>© 2026 TrafficScope. Todos os direitos reservados.</span>
          <span>Feito para quem decide com dados.</span>
        </div>
      </div>
    </footer>
  );
}