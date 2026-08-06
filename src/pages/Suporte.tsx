import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';

export default function Suporte() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');

  return (
    <CompanyPagePanel title="Fala Connosco">
      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground -mt-2 mb-1">
        <Mail className="h-3.5 w-3.5" />
        Suporte
      </div>
      <p>
        Tens uma dúvida, sugestão ou encontraste um problema? Preenche o formulário
        abaixo e a nossa equipa entra em contacto contigo.
      </p>

      <form className="space-y-4 not-prose">
        <div>
          <label htmlFor="nome" className="block text-xs font-medium text-foreground mb-1">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="O teu nome"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-foreground mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="o.teu@email.com"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="assunto" className="block text-xs font-medium text-foreground mb-1">
            Assunto
          </label>
          <input
            id="assunto"
            type="text"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Sobre o que é o teu contacto?"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="mensagem" className="block text-xs font-medium text-foreground mb-1">
            Mensagem
          </label>
          <textarea
            id="mensagem"
            rows={4}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Descreve a tua questão em detalhe..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div>
          <button
            type="button"
            disabled
            className="w-full inline-flex items-center justify-center rounded-lg bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground cursor-not-allowed"
          >
            Brevemente disponível
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            O envio direto por este formulário estará disponível em breve. Entretanto,
            fica atento às novidades na plataforma.
          </p>
        </div>
      </form>
    </CompanyPagePanel>
  );
}