import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, X, ArrowLeft } from 'lucide-react';

export default function Suporte() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');

  const voltarParaEmpresa = () => navigate('/', { state: { openCompanyMenu: true } });
  const fecharTudo = () => navigate('/', { state: { openCompanyMenu: false } });

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') voltarParaEmpresa();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={voltarParaEmpresa}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            onClick={fecharTudo}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-foreground mb-6">
          <Mail className="h-4 w-4" />
          Suporte
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Fala Connosco</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Tens uma dúvida, sugestão ou encontraste um problema? Preenche o formulário
          abaixo e a nossa equipa entra em contacto contigo.
        </p>

        <form className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-foreground mb-1.5">
                Nome
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="O teu nome"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="o.teu@email.com"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="assunto" className="block text-sm font-medium text-foreground mb-1.5">
              Assunto
            </label>
            <input
              id="assunto"
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Sobre o que é o teu contacto?"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="mensagem" className="block text-sm font-medium text-foreground mb-1.5">
              Mensagem
            </label>
            <textarea
              id="mensagem"
              rows={5}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreve a tua questão em detalhe..."
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <button
              type="button"
              disabled
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-muted px-6 py-2.5 text-sm font-semibold text-muted-foreground cursor-not-allowed"
            >
              Brevemente disponível
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              O envio direto por este formulário estará disponível em breve. Entretanto,
              fica atento às novidades na plataforma.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}