import React, { useRef, useState, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
        className="flex items-center gap-2 !text-sidebar-foreground text-sm font-semibold rounded-full px-3 py-2 hover:!bg-muted hover:!text-link-hover transition-all duration-200"
        aria-expanded={isOpen}
        aria-label="Selecionar idioma"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[200px] bg-popover rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-accent/50 ${
                lang.code === language ? 'bg-muted font-semibold text-foreground' : 'text-foreground/80'
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-base leading-none">{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === language && <Check className="ml-auto h-4 w-4 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};