import React, { useState } from 'react';
import { Search, Plus, X, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DomainInputHeaderProps {
  selectedDomains: string[];
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (domain: string) => void;
  onClearAllDomains: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export const DomainInputHeader: React.FC<DomainInputHeaderProps> = ({
  selectedDomains,
  onAddDomain,
  onRemoveDomain,
  onClearAllDomains,
  onExportPdf,
  onExportExcel
}) => {
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
    return (
      <div className="bg-background text-foreground min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Comece por adicionar um domínio
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3">
            Introduza um ou mais websites para comparar estimativas de tráfego, SEO e tecnologia.
          </p>

          <form onSubmit={handleSearchSubmit} className="relative mt-8">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite um ou mais domínios..."
                className="pl-12 pr-28 py-3 h-auto text-sm sm:text-base rounded-xl"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 gap-1.5"
              >
                Adicionar
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Com domínios ativos: barra compacta no topo, como antes.
  return (
    <div className="bg-background border-b border-border pt-6 pb-6 text-foreground shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 flex flex-col items-center text-center">

        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Análise de Tráfego & Inteligência de Mercado
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Introduza um ou vários websites para comparar estimativas de tráfego, SEO e tecnologia.
          </p>
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-4xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite um ou mais domínios..."
              className="pl-12 pr-28 py-3 h-auto text-sm sm:text-base rounded-xl"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 gap-1.5"
            >
              Adicionar
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Active Domains Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-[#279ef9]" />
            Domínios ativos:
          </span>

          {selectedDomains.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg bg-[#FFFFFF]/8 text-[#279ef9] border border-[#279ef9]/25 font-mono text-xs font-semibold shadow-2xs dark:bg-[#279ef9]/40 dark:text-[#A1C6DE] dark:border-[#279ef9]/60"
            >
              <span>{d}</span>
              <Button
                onClick={() => onRemoveDomain(d)}
                variant="ghost"
                size="icon-xs"
                className="text-[#FC2034]/50 hover:text-rose-600 hover:bg-transparent"
                title="Remover domínio"
              >
                <X className="h-3 w-3" />
              </Button>
            </span>
          ))}

          <button
            onClick={onClearAllDomains}
            className="text-xs text-muted-foreground hover:text-rose-600 underline ml-1 cursor-pointer"
          >
            Limpar todos
          </button>
        </div>

      </div>
    </div>
  );
};