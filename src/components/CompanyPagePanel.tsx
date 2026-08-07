import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { COMPANY_PANEL_WIDTH } from './Navbar';
import { useCompanyPanel } from '../context/CompanyPanelContext';

type CloseMode = 'back' | 'close';

interface CompanyPagePanelProps {
  title: string;
  children: React.ReactNode;
}

export function CompanyPagePanel({ title, children }: CompanyPagePanelProps) {
  const { requestCloseDetail, isClosing } = useCompanyPanel();
  const [isVisible, setIsVisible] = useState(false);
  const [isLocalClosing, setIsLocalClosing] = useState(false);

  // Reage também a fechos disparados de fora (ex: botão "Empresa" na Navbar),
  // não só aos botões internos "Voltar"/"Fechar" — garante que a animação
  // de saída toca sempre, seja qual for a origem do fecho.
  useEffect(() => {
    if (isClosing) {
      setIsLocalClosing(true);
    }
  }, [isClosing]);

  // Guard por ref (não por state) para não sofrer de closures desatualizadas
  // no listener de ESC, que só é registado uma vez.
  const closingGuardRef = useRef(false);

  // Monta "escondido" e só no frame seguinte passa a visível,
  // para a transição de entrada correr sempre a partir do mesmo ponto de partida.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = (mode: CloseMode) => {
    if (closingGuardRef.current) return;
    closingGuardRef.current = true;
    setIsLocalClosing(true); // estado local, só liga, nunca volta a desligar-se sozinho
    requestCloseDetail(mode); // trata a navegação + sincronismo com o painel preto
  };

  const voltarParaEmpresa = () => handleClose('back');
  const fecharTudo = () => handleClose('close');

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') voltarParaEmpresa();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Depende só de estado local — nunca é reposto a "aberto" por causa
  // do timing da navegação/context, por isso não há como "piscar".
  const show = isVisible && !isLocalClosing;

  return (
    <div
      style={{ left: COMPANY_PANEL_WIDTH, width: COMPANY_PANEL_WIDTH }}
      className={`fixed top-20 z-40 h-[calc(100vh-5rem)] bg-background border-r border-border shadow-2xl overflow-y-auto transition-all duration-200 ease-out ${
        show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
    >
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <button
            onClick={voltarParaEmpresa}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>
          <button
            onClick={fecharTudo}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        <h1 className="text-lg font-bold text-foreground mb-4">{title}</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-3 text-xs">
          {children}
        </div>
      </div>
    </div>
  );
}