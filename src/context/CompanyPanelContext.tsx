import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

type CloseMode = 'back' | 'close';

interface CompanyPanelContextValue {
  isMenuOpen: boolean;
  isClosing: boolean;
  isMenuClosing: boolean;
  openMenu: () => void;
  closeMenuNow: () => void;
  toggleMenu: () => void;
  requestCloseDetail: (mode: CloseMode) => void;
}

const CompanyPanelContext = createContext<CompanyPanelContextValue | null>(null);

const ANIMATION_MS = 200;

export function CompanyPanelProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);

  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const closeMenuNow = useCallback(() => setIsMenuOpen(false), []);
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);

  // Evita que ESC em repetição (ou duplo clique) dispare vários fechos sobrepostos
  const isClosingRef = useRef(false);

  // Chamado pelos botões "Voltar" / "Fechar" do painel branco (CompanyPagePanel).
  // 'back'  -> fecha só o painel branco, o preto fica aberto como estava.
  // 'close' -> fecha os dois em sincronia.
  const requestCloseDetail = useCallback((mode: CloseMode) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    setIsClosing(true);
    if (mode === 'close') {
      setIsMenuClosing(true);
    }

    setTimeout(() => {
      if (mode === 'close') {
        setIsMenuOpen(false);
        setIsMenuClosing(false);
      }
      navigate('/');
      setIsClosing(false);
      isClosingRef.current = false;
    }, ANIMATION_MS);
  }, [navigate]);

  return (
    <CompanyPanelContext.Provider
      value={{ isMenuOpen, isClosing, isMenuClosing, openMenu, closeMenuNow, toggleMenu, requestCloseDetail }}
    >
      {children}
    </CompanyPanelContext.Provider>
  );
}

export function useCompanyPanel() {
  const ctx = useContext(CompanyPanelContext);
  if (!ctx) throw new Error('useCompanyPanel deve ser usado dentro de CompanyPanelProvider');
  return ctx;
}