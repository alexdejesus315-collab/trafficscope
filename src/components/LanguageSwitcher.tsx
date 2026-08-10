import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGES, Language } from '../context/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (toggleRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={toggleRef}
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 !text-sidebar-foreground text-base font-semibold rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200"
        aria-expanded={isOpen}
        aria-label="Selecionar idioma"
      >
        <span className="text-lg leading-none">{current.flag}</span>
        <span className="hidden sm:inline uppercase text-sm">{current.code}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[200px]
                     bg-popover rounded-2xl
                     border border-border
                     shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                     overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-accent/50 ${
                lang.code === language ? 'bg-primary/5 font-semibold text-foreground' : 'text-foreground/80'
              }`}
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              <span className="ml-auto text-[11px] uppercase text-muted-foreground">{lang.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};