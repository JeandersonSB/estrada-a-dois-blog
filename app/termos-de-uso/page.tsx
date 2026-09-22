import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | Estrada a Dois',
  description: 'Termos e condições de uso do portal Estrada a Dois.',
};

export default function TermosDeUso() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-8 md:p-16 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-black text-[#0F0F0F] uppercase mb-8 border-b-4 border-[#B6D200] pb-4 inline-block">
            Termos de Uso
          </h1>

          <div className="prose prose-gray max-w-none text-[#555555] font-medium leading-relaxed space-y-6">
            <p>
              Seja bem-vindo ao <strong>Estrada a Dois</strong>. Ao acessar e utilizar o site
              <a href="https://www.estradaadois.com" className="text-[#8ac200] hover:underline font-bold"> estradaadois.com</a>,
              você concorda com estes Termos de Uso.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">1. Finalidade do portal</h2>
            <p>
              O Estrada a Dois é um portal editorial sobre mototurismo, viagens a dois, roteiros, planejamento,
              equipamentos, manutenção preventiva e notícias do universo motociclístico. Nosso conteúdo tem finalidade
              informativa, editorial e de entretenimento.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">2. Roteiros, pilotagem e mecânica</h2>
            <p>
              Relatos de viagem, condições de vias, estimativas de tempo, custos e orientações de manutenção ou
              pilotagem refletem experiências, pesquisas e informações disponíveis no momento da publicação.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Responsabilidade do condutor:</strong> cada piloto deve avaliar suas condições, experiência,
                documentação, motocicleta e equipamentos antes de qualquer deslocamento.
              </li>
              <li>
                <strong>Condições variáveis:</strong> clima, pavimento, pedágios, regras de trânsito, preços,
                horários e bloqueios podem mudar. Consulte fontes oficiais antes da viagem.
              </li>
              <li>
                <strong>Manutenção:</strong> procedimentos técnicos devem respeitar o manual da motocicleta. Ajustes
                críticos envolvendo freios, motor, suspensão ou segurança devem ser executados por profissional qualificado.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">3. Conteúdo editorial e fontes</h2>
            <p>
              Notícias e informações técnicas podem utilizar dados de fabricantes, órgãos públicos, veículos
              especializados, documentos técnicos e outras fontes identificadas. O portal realiza revisão editorial
              antes da publicação e busca acrescentar contexto relevante para o motociclista brasileiro.
            </p>
            <p>
              Informações podem ser corrigidas ou atualizadas quando surgirem dados novos ou quando identificarmos
              alguma imprecisão. Saiba mais em nossa{' '}
              <a href="/politica-editorial" className="text-[#8ac200] hover:underline font-bold">Política Editorial</a>.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">4. Propriedade intelectual</h2>
            <p>
              Textos autorais, relatos, identidade visual, fotografias próprias, vídeos e demais materiais produzidos
              pelo Estrada a Dois são protegidos pela legislação aplicável. Citações breves são permitidas com crédito
              e referência ao conteúdo original.
            </p>
            <p>
              Marcas, logotipos e materiais de terceiros pertencem a seus respectivos titulares e, quando utilizados
              editorialmente, permanecem sujeitos às regras de uso e direitos correspondentes.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">5. Publicidade e parcerias</h2>
            <p>
              O site <strong>poderá exibir</strong> publicidade de terceiros, inclusive por plataformas como Google
              AdSense, além de realizar parcerias comerciais identificadas de forma apropriada. A existência de
              publicidade ou parceria não transfere ao Estrada a Dois responsabilidade pela entrega, garantia ou
              conformidade de produtos e serviços oferecidos por terceiros.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">6. Links externos</h2>
            <p>
              Links para fabricantes, órgãos oficiais, fontes jornalísticas, mapas, hotéis, restaurantes ou outros
              serviços externos são fornecidos como referência. O Estrada a Dois não controla conteúdo, disponibilidade,
              políticas ou práticas dos sites de destino.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">7. Formulário e conduta do usuário</h2>
            <p>
              Ao utilizar nossos canais de contato, o usuário concorda em não enviar spam, conteúdo ilícito, ofensivo,
              fraudulento ou destinado a comprometer a segurança do portal. O tratamento dos dados enviados está
              descrito na nossa <a href="/politica-de-privacidade" className="text-[#8ac200] hover:underline font-bold">
                Política de Privacidade
              </a>.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">8. Alterações destes termos</h2>
            <p>
              Estes termos poderão ser atualizados para refletir mudanças editoriais, técnicas ou legais. A versão
              vigente estará sempre disponível nesta página.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">9. Contato</h2>
            <p>
              Dúvidas podem ser enviadas para{' '}
              <a href="mailto:contato@estradaadois.com" className="text-[#8ac200] hover:underline font-bold">
                contato@estradaadois.com
              </a>.
            </p>

            <p className="font-bold text-[#0F0F0F]">Última atualização: 22 de setembro de 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
