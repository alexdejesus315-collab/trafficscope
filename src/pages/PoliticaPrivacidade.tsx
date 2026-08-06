import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';

export default function PoliticaPrivacidade() {
  return (
    <CompanyPagePanel title="Política de Privacidade">
      <p className="text-[11px] text-muted-foreground -mt-2">Última atualização: agosto de 2026</p>

      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">1. Dados que recolhemos</h2>
        <p>
          Ao criar uma conta através do login com Google, recolhemos o teu nome, email
          e, se disponível, a imagem de perfil associada à conta. Guardamos também
          informação sobre o teu plano de subscrição e o histórico de uso da plataforma
          (domínios pesquisados, número de análises e exportações realizadas), para
          aplicar corretamente os limites de cada plano.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">2. Como usamos os dados</h2>
        <p>
          Os dados são usados exclusivamente para operar a plataforma: autenticação,
          gestão da tua subscrição, aplicação dos limites de uso associados ao teu
          plano e melhoria contínua do serviço. Não vendemos nem partilhamos os teus
          dados pessoais com terceiros para fins de marketing.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">3. Domínios pesquisados</h2>
        <p>
          Os domínios que pesquisas na plataforma podem ficar associados à tua conta,
          para efeitos de controlo de limites diários de uso e histórico de análises.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">4. Pagamentos</h2>
        <p>
          Os pagamentos de subscrição são processados por um fornecedor externo
          especializado em faturação SaaS. Não armazenamos dados de cartões de
          crédito nos nossos servidores.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">5. Os teus direitos</h2>
        <p>
          Podes solicitar a qualquer momento o acesso, a correção ou a eliminação dos
          teus dados pessoais, bem como o cancelamento da tua conta e subscrição.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">6. Contacto</h2>
        <p>
          Para questões relacionadas com privacidade de dados, entra em contacto
          através dos canais disponíveis na plataforma.
        </p>
      </section>
    </CompanyPagePanel>
  );
}