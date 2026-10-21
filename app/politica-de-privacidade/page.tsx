import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Estrada a Dois',
  description: 'Saiba como o Estrada a Dois trata dados pessoais, cookies, métricas de audiência e mensagens de contato.',
};

export default function PoliticaPrivacidade() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-8 md:p-16 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-black text-[#0F0F0F] uppercase mb-8 border-b-4 border-[#B6D200] pb-4 inline-block">
            Política de Privacidade
          </h1>

          <div className="prose prose-gray max-w-none text-[#555555] font-medium leading-relaxed space-y-6">
            <p>
              O <strong>Estrada a Dois</strong>, sob responsabilidade de Jeanderson de Souza Batista, respeita a privacidade de seus visitantes e trata dados pessoais de
              forma compatível com a legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais
              (LGPD — Lei nº 13.709/2018).
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">1. Dados que podemos coletar</h2>
            <p>
              Ao navegar pelo site, alguns dados técnicos podem ser processados pela infraestrutura de hospedagem,
              como endereço IP, data e hora de acesso, navegador, dispositivo e registros necessários para segurança
              e funcionamento do serviço.
            </p>
            <p>
              Quando você utiliza o formulário de contato, podemos receber os dados que optar por informar, incluindo
              <strong> nome, WhatsApp, e-mail, assunto e mensagem</strong>. Esses dados são usados exclusivamente para
              receber, analisar e responder ao contato enviado.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">2. Formulário de contato e Telegram</h2>
            <p>
              As mensagens enviadas pelo formulário do site são encaminhadas para um canal privado da equipe por meio
              da API do <strong>Telegram</strong>. Dessa forma, os dados informados no formulário podem ser processados
              pelos serviços do Telegram para viabilizar a entrega da mensagem.
            </p>
            <p>
              Evite incluir informações sensíveis ou dados desnecessários no formulário. Mantemos as informações
              somente pelo período necessário para atendimento, organização de contatos e cumprimento de obrigações
              aplicáveis.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">3. Cookies e armazenamento local</h2>
            <p>
              O site utiliza armazenamento local do navegador para registrar sua escolha de privacidade. Esse recurso
              é necessário para lembrar se você aceitou ou rejeitou recursos analíticos e evitar que a preferência
              precise ser informada a cada visita.
            </p>
            <p>
              Recursos não essenciais de medição só são carregados depois de uma escolha positiva do visitante.
              Você pode alterar sua decisão a qualquer momento pelo link <strong>Preferências de Cookies</strong> no
              rodapé do site.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">4. Google Analytics 4</h2>
            <p>
              Com sua autorização, utilizamos o <strong>Google Analytics 4</strong> para compreender, de forma agregada,
              como o portal é utilizado, quais páginas recebem mais visitas e como podemos melhorar conteúdo e
              desempenho. Se você rejeitar, o Google Analytics não será carregado. Se já tiver aceitado e depois retirar a autorização, desativamos a medição futura e tentamos remover os cookies analíticos acessíveis neste domínio. Isso não apaga automaticamente dados já recebidos pelo Google.
            </p>
            <p>
              O tratamento realizado pelo Google segue os próprios termos e políticas de privacidade da empresa.
              Você pode manter os recursos analíticos desativados sem impedir a navegação pelo Estrada a Dois.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">5. Publicidade e Google AdSense</h2>
            <p>
              O site está cadastrado no Google AdSense, mas esta versão não exibe anúncios nem utiliza cookies publicitários. Caso a exibição de anúncios seja ativada, esta política e os controles de privacidade serão atualizados antes da utilização de tecnologias publicitárias.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">6. Serviços de terceiros</h2>
            <p>
              Para operar o portal, podemos utilizar serviços de terceiros, como infraestrutura de hospedagem e
              distribuição de conteúdo da Vercel, serviços do Google e a API do Telegram. Esses fornecedores podem
              processar dados técnicos estritamente necessários à prestação de seus serviços, segundo seus próprios
              termos e políticas.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">7. Links externos</h2>
            <p>
              Nossos artigos podem conter links para sites de terceiros. Não controlamos as práticas de privacidade,
              segurança ou conteúdo desses endereços. Recomendamos consultar as políticas do site de destino.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">8. Direitos do titular</h2>
            <p>
              Nos termos da LGPD, você pode solicitar, quando aplicável, confirmação de tratamento, acesso, correção,
              atualização, anonimização, bloqueio ou exclusão de dados, informações sobre compartilhamento e portabilidade nos termos da regulamentação aplicável, além de revogar consentimentos concedidos e apresentar reclamação à ANPD. Podemos solicitar informações mínimas para confirmar sua identidade e proteger seus dados.
            </p>
            <p>
              Solicitações podem ser encaminhadas para{' '}
              <a href="mailto:contato@estradaadois.com" className="text-[#8ac200] hover:underline font-bold">
                contato@estradaadois.com
              </a>.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">9. Segurança e alterações</h2>
            <p>
              Adotamos medidas razoáveis de segurança e minimização de dados. Esta política poderá ser atualizada
              quando houver alterações relevantes nos serviços, tecnologias utilizadas ou requisitos legais.
            </p>

            <h2 id="rota-biker" className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">10. Mapa de monumentos — Rota Biker</h2>
            <p>
              O Estrada a Dois é responsável por esta ferramenta independente de controle pessoal de visitas.
              Sem login, as marcações ficam no armazenamento local do navegador. Ao aceitar o aviso e entrar com
              Google, você autoriza o uso do nome, e-mail, foto de perfil (se disponível) e identificador da conta
              fornecidos pelo Google para autenticação. As marcações são associadas ao identificador da conta no
              Firebase para permitir acesso privado e sincronização entre dispositivos. As visitas marcadas sem login permanecem neste navegador e não são importadas automaticamente para a conta. O cartão para Stories é gerado no seu dispositivo; baixar a imagem não a publica nas redes sociais.
            </p>
            <p>
              Utilizamos Google Authentication/Firebase Authentication e Cloud Firestore para essas finalidades.
              Esses serviços processam os dados segundo seus próprios termos e políticas, podendo envolver
              infraestrutura fora do Brasil. Esta autorização não abrange envio de publicidade. As marcações não são publicadas, vendidas nem repassadas aos organizadores da Rota Biker ou a anunciantes. A equipe responsável pode acessar os dados pelos painéis administrativos para suporte, segurança e atendimento aos seus direitos; os fornecedores envolvidos também os processam para operar o serviço.
            </p>
            <p>
              A localização depende de uma permissão separada do navegador e é utilizada para encontrar destinos
              próximos e planejar o trajeto. Suas coordenadas não são gravadas no histórico da conta. Ao abrir o
              Google Maps ou Waze, as informações necessárias ao trajeto são encaminhadas ao serviço escolhido.
              Você também pode digitar a cidade ou endereço de partida. Esse endereço e a sequência do roteiro
              ficam na memória desta página e não são salvos no histórico da conta; são enviados ao Google Maps
              quando você escolhe abrir o roteiro. Fechar ou recarregar a página limpa esse planejamento.
              O mapa utiliza o OpenStreetMap, que pode receber dados técnicos necessários ao carregamento.
            </p>
            <p>
              Você pode recusar o aviso e continuar usando o mapa sem login. Os dados da conta são mantidos
              enquanto necessários à sincronização e até solicitação de exclusão, ressalvadas obrigações legais
              aplicáveis. Para exercer seus direitos, solicitar exclusão ou revogar o consentimento, escreva para{' '}
              <a href="mailto:contato@estradaadois.com" className="text-[#8ac200] hover:underline font-bold">contato@estradaadois.com</a>.
              Sair da conta interrompe a sessão, mas não exclui o histórico já salvo. Para remover marcações locais,
              desmarque os monumentos ou limpe os dados deste site no navegador.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">11. Finalidades, escolhas e conservação</h2>
            <p>
              A medição de audiência e o uso dos dados autorizados no login se baseiam no seu consentimento.
              O atendimento de solicitações usa os dados necessários ao contato e, conforme o caso, a procedimentos
              solicitados por você. Registros técnicos são tratados para funcionamento e segurança, com base no
              legítimo interesse, respeitados seus direitos, ou no cumprimento de obrigações legais aplicáveis.
              Não usamos o contato nem o login como autorização para campanhas de marketing.
            </p>
            <p>
              A preferência de cookies fica neste navegador até ser alterada ou até você limpar os dados do site.
              Marcações de visitante permanecem até serem removidas ou até a limpeza do navegador; autenticação
              pode usar armazenamento próprio do Firebase. Esses recursos não dependem da autorização ao Analytics.
              O prazo de cookies e dados mantidos pelos fornecedores varia conforme o serviço e suas configurações;
              não há um prazo único para todos os dados. Dados de atendimento são conservados pelo tempo necessário
              à solicitação e às obrigações aplicáveis. Excluir o histórico do mapa não exclui sua conta Google.
            </p>
            <p>
              Fornecedores de hospedagem, autenticação, mapas, métricas e mensagens podem processar dados fora do
              Brasil. Consulte também as políticas de{' '}
              <a href="https://policies.google.com/privacy" className="text-[#8ac200] hover:underline">Google</a>,{' '}
              <a href="https://vercel.com/legal/privacy-policy" className="text-[#8ac200] hover:underline">Vercel</a>,{' '}
              <a href="https://telegram.org/privacy" className="text-[#8ac200] hover:underline">Telegram</a> e{' '}
              <a href="https://osmfoundation.org/wiki/Privacy_Policy" className="text-[#8ac200] hover:underline">OpenStreetMap</a>.
            </p>

            <p className="font-bold text-[#0F0F0F]">Última atualização: 20 de outubro de 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
