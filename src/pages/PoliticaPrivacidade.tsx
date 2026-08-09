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
          informação sobre o teu saldo de créditos, o modo de pesquisa selecionado
          (Teste ou Real), o número total de pesquisas e compras de créditos realizadas,
          e o histórico das tuas pesquisas em Modo Real (até 50 mais recentes).
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">2. Como usamos os dados</h2>
        <p>
          Os dados são usados exclusivamente para operar a plataforma: autenticação,
          gestão do teu saldo de créditos, permitir-te reconsultar pesquisas anteriores
          sem custo adicional, envio de notificações sobre a tua atividade na
          plataforma (ex: pesquisa concluída, créditos a acabar) e melhoria contínua
          do serviço. Não vendemos nem partilhamos os teus dados pessoais com terceiros
          para fins de marketing.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">3. Domínios pesquisados</h2>
        <p>
          Os domínios que pesquisas em Modo Real na plataforma ficam associados à tua
          conta e guardados no teu Histórico de Pesquisas, para que possas reabrir e
          exportar os resultados sem gastar crédito novamente. Podes apagar itens
          individuais ou todo o histórico a qualquer momento, diretamente na página de
          Histórico.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">4. Pagamentos</h2>
        <p>
          As compras de créditos são processadas por um fornecedor externo
          especializado em pagamentos online. Não armazenamos dados de cartões de
          crédito nos nossos servidores.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">5. Os teus direitos</h2>
        <p>
          Podes solicitar a qualquer momento o acesso, a correção ou a eliminação dos
          teus dados pessoais, apagar o teu histórico de pesquisas, e o cancelamento
          da tua conta.
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