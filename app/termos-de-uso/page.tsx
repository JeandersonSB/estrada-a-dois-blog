import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso | Estrada a Dois',
  description: 'Termos e Condições de Uso do portal e blog Estrada a Dois.',
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
              Seja bem-vindo ao <strong>Estrada a Dois</strong>. Ao acessar e utilizar o nosso site (<a href="https://estradaadois.com" className="text-[#B6D200] hover:underline font-bold">estradaadois.com</a> e seus subdomínios ou canais associados), você concorda expressamente em cumprir e estar vinculado aos seguintes Termos e Condições de Uso. Caso não concorde com qualquer disposição destes termos, recomendamos que não utilize este website.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">1. Objeto e Finalidade do Site</h2>
            <p>
              O <strong>Estrada a Dois</strong> é um portal e diário de bordo voltado ao mototurismo, viagens a dois, planejamento de rotas, avaliações de equipamentos, dicas de manutenção e notícias do universo automotivo e motociclístico. Nosso objetivo é inspirar, entreter e informar entusiastas da estrada com relatos autênticos e conteúdos educativos.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">2. Isenção de Responsabilidade (Roteiros, Pilotagem e Mecânica)</h2>
            <p>
              As rotas, relatos de viagem, condições de estradas, estimativas de tempo e custos, bem como dicas de manutenção mecânica e pilotagem compartilhadas neste portal baseiam-se em nossas experiências pessoais e levantamentos informativos no momento da apuração.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Responsabilidade Individual do Piloto:</strong> Cada condutor é o único e exclusivo responsável por avaliar suas condições físicas, psicológicas e habilidades de pilotagem, bem como a conformidade do seu veículo, equipamentos de proteção individual (EPIs) e documentos de trânsito antes de iniciar qualquer viagem.
              </li>
              <li>
                <strong>Condições Dinâmicas de Vias e Clima:</strong> Condições climáticas, asfaltamento, pedágios, sinalização e bloqueios viários mudam constantemente. Recomendamos sempre checar órgãos oficiais (DNIT, Polícia Rodoviária e concessionárias locais) antes de pegar a estrada.
              </li>
              <li>
                <strong>Procedimentos Mecânicos:</strong> Qualquer orientação preventiva deve ser conferida com o manual do proprietário da sua motocicleta e realizada preferencialmente por mecânicos profissionais capacitados.
              </li>
            </ul>
            <p>
              O <strong>Estrada a Dois</strong> e seus autores não se responsabilizam por quaisquer danos materiais, acidentes, imprevistos mecânicos, infrações de trânsito ou prejuízos diretos ou indiretos decorrentes da aplicação prática das informações disponibilizadas.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">3. Propriedade Intelectual e Direitos Autorais</h2>
            <p>
              Todo o conteúdo publicado neste site — incluindo textos, relatos do Diário de Bordo, logotipos, marcas, fotografias autorais, vídeos e elementos visuais — é protegido pela legislação brasileira de direitos autorais (Lei nº 9.610/1998) e tratados internacionais.
            </p>
            <p>
              É estritamente proibida a cópia, reprodução integral, redistribuição comercial ou modificação de qualquer conteúdo autoral sem a prévia autorização por escrito dos criadores. Citações breves são permitidas desde que acompanhadas de crédito claro e link direto para a postagem original.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">4. Publicidade, Parceiros e Google AdSense</h2>
            <p>
              O site exibe anúncios e materiais promocionais veiculados por terceiros, nomeadamente através do programa <strong>Google AdSense</strong> e eventuais parcerias com marcas do setor.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Não temos controle prévio nem nos responsabilizamos pela qualidade, entrega, garantia ou conformidade de produtos ou serviços oferecidos pelos anunciantes em banners ou links externos.
              </li>
              <li>
                A relação de consumo eventualmente estabelecida pelo usuário com qualquer anunciante externo ocorre estritamente entre as partes envolvidas.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">5. Conduta do Usuário e Mensagens de Contato</h2>
            <p>
              Ao utilizar formulários de contato ou canais de comentários do site, o usuário se compromete a:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer informações verdadeiras e não utilizar identidades falsas;</li>
              <li>Não enviar spam, correntes, publicidade não solicitada ou mensagens com conteúdo ofensivo, discriminatório, difamatório ou ilegal;</li>
              <li>Não tentar violar a segurança, sobrecarregar servidores ou interferir no bom funcionamento da plataforma.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">6. Modificações destes Termos</h2>
            <p>
              Reservamo-nos o direito de alterar ou atualizar estes Termos de Uso a qualquer momento, visando adequação legislativa ou aprimoramento dos serviços. As modificações entram em vigor imediatamente após sua publicação nesta página.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">7. Legislação Aplicável e Foro</h2>
            <p>
              Estes Termos de Uso são regidos e interpretados em conformidade com a legislação da República Federativa do Brasil.
            </p>
            <p className="font-bold text-[#0F0F0F]">
              Em caso de dúvidas, sugestões ou solicitações referentes aos nossos termos, entre em contato através do e-mail: <a href="mailto:contato@estradaadois.com" className="text-[#B6D200] hover:underline">contato@estradaadois.com</a>.
            </p>
            <p className="text-xs text-gray-400">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
