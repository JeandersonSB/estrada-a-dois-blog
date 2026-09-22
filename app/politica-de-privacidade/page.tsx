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
              O <strong>Estrada a Dois</strong> respeita a privacidade de seus visitantes e trata dados pessoais de
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
              desempenho. O Google Analytics não é carregado quando você rejeita os recursos analíticos.
            </p>
            <p>
              O tratamento realizado pelo Google segue os próprios termos e políticas de privacidade da empresa.
              Você pode manter os recursos analíticos desativados sem impedir a navegação pelo Estrada a Dois.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">5. Publicidade e Google AdSense</h2>
            <p>
              O Estrada a Dois poderá futuramente utilizar plataformas de publicidade, incluindo o Google AdSense.
              Caso anúncios e tecnologias publicitárias sejam ativados, esta política e o mecanismo de consentimento
              serão adequados às exigências aplicáveis antes da utilização desses recursos.
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
              atualização ou exclusão de dados, além de revogar consentimentos concedidos.
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

            <p className="font-bold text-[#0F0F0F]">Última atualização: 22 de setembro de 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
