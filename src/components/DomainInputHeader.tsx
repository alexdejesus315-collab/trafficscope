import React, { useState } from 'react';
import { Search, Plus, X, Layers, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface DomainInputHeaderProps {
  selectedDomains: string[];
  primaryDomain?: string;
  onSelectPrimaryDomain?: (domain: string) => void;
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (domain: string) => void;
  onClearAllDomains: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export const DomainInputHeader: React.FC<DomainInputHeaderProps> = ({
  selectedDomains,
  primaryDomain,
  onSelectPrimaryDomain,
  onAddDomain,
  onRemoveDomain,
  onClearAllDomains,
  onExportPdf,
  onExportExcel
}) => {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const isEmpty = selectedDomains.length === 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const domainsToAdd = inputValue
      .split(/[\s,]+/)
      .map(d => d.trim().toLowerCase())
      .filter(d => d.length > 2);

    domainsToAdd.forEach(d => onAddDomain(d));
    setInputValue('');
  };

  // Sem domínios selecionados: layout "hero" centrado, como a primeira página de um app de IA.
  if (isEmpty) {
    const suggestedDomains = ['google.com', 'amazon.com', 'netflix.com'];

    return (
      <div className="bg-background text-foreground min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-5">
            <Activity className="h-6 w-6 text-primary" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {t('domainInput.hero.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3">
            {t('domainInput.hero.subtitle')}
          </p>

          <form onSubmit={handleSearchSubmit} className="relative mt-8">
            <div className="relative flex items-center bg-card rounded-2xl shadow-md p-1.5 transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/30">
              <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('domainInput.placeholder')}
                className="pl-12 pr-28 py-3 h-auto text-sm sm:text-base rounded-xl border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2.5 gap-1.5 hover:bg-primary/80 transition-colors"
              >
                {t('domainInput.addButton')}
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-xs text-muted-foreground">{t('domainInput.hero.suggestedLabel')}</span>
            {suggestedDomains.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onAddDomain(d)}
                className="text-xs font-mono px-3 py-1 rounded-full bg-card text-muted-foreground shadow-sm hover:text-primary hover:shadow-md transition-all"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Com domínios ativos: barra compacta no topo, como antes.
  return (
    <div className="bg-background pt-6 pb-6 text-foreground shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 flex flex-col items-center text-center">

        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {t('domainInput.bar.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t('domainInput.hero.subtitle')}
          </p>
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-4xl">
          <div className="relative flex items-center bg-card rounded-2xl shadow-md p-1 transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-primary/30">
            <Search className="absolute left-5 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('domainInput.placeholder')}
              className="pl-12 pr-28 py-3 h-auto text-sm sm:text-base rounded-xl border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2.5 gap-1.5"
            >
              {t('domainInput.addButton')}
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Active Domains Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-primary" />
            {t('domainInput.bar.activeDomainsLabel')}
          </span>

          {/* ALTERADO: chip clicável — clicar troca qual domínio fica em destaque no painel principal */}
          {selectedDomains.map((d) => {
            const isActive = d === primaryDomain;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelectPrimaryDomain?.(d)}
                title={isActive ? t('domainInput.bar.activeDomainTooltip') : t('domainInput.bar.inactiveDomainTooltip')}
                className={cn(
                  'inline-flex items-center gap-4 pl-1 pr-0.2 py-0.1 rounded-full font-mono text-xs font-semibold transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/80'
                    : 'text-muted-foreground hover:bg-primary/20 hover:text-primary'
                )}
              >
                <span>{d}</span>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveDomain(d);
                  }}
                  variant="ghost"
                  size="icon-xs"
                  className={cn(
                    'hover:bg-transparent',
                    isActive ? 'text-primary-foreground/70 hover:text-primary-foreground' : 'text-destructive/50 hover:text-destructive'
                  )}
                  title={t('domainInput.bar.removeDomainTooltip')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </button>
            );
          })}

          <button
            onClick={onClearAllDomains}
            className="text-xs text-muted-foreground hover:text-destructive underline ml-1 cursor-pointer"
          >
            {t('domainInput.bar.clearAll')}
          </button>
        </div>

      </div>
    </div>
  );
};