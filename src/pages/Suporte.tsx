import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';
import { useLanguage } from '../context/LanguageContext';

export default function Suporte() {
  const { t } = useLanguage();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');

  return (
    <CompanyPagePanel title={t('support.title')}>
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground mb-2">
        <Mail className="h-3.5 w-3.5" />
        {t('support.badge')}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        {t('support.intro')}
      </p>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-2xs">
        <form className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-xs font-medium text-foreground mb-1">
              {t('support.form.name.label')}
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={t('support.form.name.placeholder')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-foreground mb-1">
              {t('support.form.email.label')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('support.form.email.placeholder')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="assunto" className="block text-xs font-medium text-foreground mb-1">
              {t('support.form.subject.label')}
            </label>
            <input
              id="assunto"
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder={t('support.form.subject.placeholder')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="mensagem" className="block text-xs font-medium text-foreground mb-1">
              {t('support.form.message.label')}
            </label>
            <textarea
              id="mensagem"
              rows={4}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder={t('support.form.message.placeholder')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center rounded-lg bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground cursor-not-allowed"
            >
              {t('support.form.button')}
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t('support.form.comingSoonText')}
            </p>
          </div>
        </form>
      </div>
    </CompanyPagePanel>
  );
}