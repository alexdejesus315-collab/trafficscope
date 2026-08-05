import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, X, ArrowLeft } from 'lucide-react';
import { useEscapeGoBack } from '../hooks/useEscapeGoBack';

export default function PoliticaPrivacidade() {
  useEscapeGoBack();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-xs text-muted-foreground mb-8">Última atualização: agosto de 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">1. Dados que recolhemos</h2>
            <p>
              Ao criar uma conta através do login com Google, recolhemos o teu nome, email
              e, se disponível, a imagem de perfil associada à conta. Guardamos também
              informação sobre o teu plano de subscrição e o histórico de uso da plataforma
              (domínios pesquisados, número de análises e exportações realizadas), para
              aplicar corretamente os limites de cada plano.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">2. Como usamos os dados</h2>
            <p>
              Os dados são usados exclusivamente para operar a plataforma: autenticação,
              gestão da tua subscrição, aplicação dos limites de uso associados ao teu
              plano e melhoria contínua do serviço. Não vendemos nem partilhamos os teus
              dados pessoais com terceiros para fins de marketing.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">3. Domínios pesquisados</h2>
            <p>
              Os domínios que pesquisas na plataforma podem ficar associados à tua conta,
              para efeitos de controlo de limites diários de uso e histórico de análises.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">4. Pagamentos</h2>
            <p>
              Os pagamentos de subscrição são processados por um fornecedor externo
              especializado em faturação SaaS. Não armazenamos dados de cartões de
              crédito nos nossos servidores.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">5. Os teus direitos</h2>
            <p>
              Podes solicitar a qualquer momento o acesso, a correção ou a eliminação dos
              teus dados pessoais, bem como o cancelamento da tua conta e subscrição.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">6. Contacto</h2>
            <p>
              Para questões relacionadas com privacidade de dados, entra em contacto
              através dos canais disponíveis na plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}