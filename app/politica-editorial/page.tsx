import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política Editorial | Estrada a Dois',
  description: 'Conheça os critérios de experiência prática, revisão, correções e independência usados pelo Estrada a Dois.',
};

export default function PoliticaEditorial() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white p-8 md:p-16 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl md:text-4xl font-black text-[#0F0F0F] uppercase mb-8 border-b-4 border-[#B6D200] pb-4 inline-block">
            Política Editorial
          </h1>

          <div className="prose prose-gray max-w-none text-[#555555] font-medium leading-relaxed space-y-6">
            <p>
              O <strong>Estrada a Dois</strong> é um projeto de mototurismo criado por Jeanderson e Ana Paula para
              registrar experiências reais de viagens de moto e transformar o que vivemos na estrada em roteiros,
              dicas, guias de planejamento, conteúdos sobre equipamentos e cuidados com a moto.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">1. Experiência prática em primeiro lugar</h2>
            <p>
              Sempre que o conteúdo estiver relacionado a uma viagem realizada por nós, priorizamos informações da
              experiência real: percurso, distâncias, custos, paradas, hospedagens, equipamentos utilizados,
              dificuldades encontradas, fotografias, vídeos e aprendizados do trajeto.
            </p>
            <p>
              Quando ainda não tivemos experiência direta com determinado item ou procedimento, procuramos deixar isso
              claro e separar observação prática de informação técnica ou recomendação geral.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">2. Fontes e informações técnicas</h2>
            <p>
              Para documentação, regras de trânsito ou fronteira, especificações técnicas, manutenção, segurança e
              demais informações que dependem de confirmação externa, priorizamos fabricantes, manuais, órgãos oficiais,
              documentos técnicos e fontes especializadas reconhecidas.
            </p>
            <p>
              Como preços, estradas, horários, regras e condições podem mudar, recomendamos que informações operacionais
              sejam confirmadas em fontes oficiais antes de uma viagem ou procedimento.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">3. Revisão antes da publicação</h2>
            <p>
              Todo artigo publicado passa por revisão antes de entrar no site. Verificamos clareza, coerência,
              utilidade, informações técnicas, links, imagens e adequação à proposta do Estrada a Dois.
            </p>
            <p>
              Ferramentas digitais e inteligência artificial podem auxiliar em pesquisa, organização e estruturação,
              mas a seleção do tema, a revisão e a decisão de publicação permanecem sob responsabilidade editorial do
              Estrada a Dois.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">4. Roteiros e viagens</h2>
            <p>
              Roteiros e Diários de Bordo são construídos para ajudar outros motociclistas a planejar viagens com mais
              contexto. Sempre que possível, incluímos não apenas o destino, mas também logística, custos, tempo de
              deslocamento, condições encontradas e o que faríamos diferente em uma próxima viagem.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">5. Equipamentos, manutenção e segurança</h2>
            <p>
              Conteúdos de equipamentos e manutenção têm finalidade informativa e são orientados ao uso na estrada.
              Sempre que houver procedimento crítico, indicamos consulta ao manual do fabricante e, quando apropriado,
              execução por profissional qualificado. Segurança tem prioridade sobre conveniência ou economia.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">6. Correções e atualizações</h2>
            <p>
              Se identificarmos informação incorreta, desatualizada ou ambígua, podemos corrigir ou atualizar o
              conteúdo. Leitores também podem apontar erros pelo e-mail{' '}
              <a href="mailto:contato@estradaadois.com" className="text-[#8ac200] hover:underline font-bold">
                contato@estradaadois.com
              </a>.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">7. Independência editorial</h2>
            <p>
              Parcerias comerciais, ações com marcas ou conteúdos patrocinados não devem alterar fatos técnicos nem
              transformar opinião comercial em informação editorial. Quando uma publicação envolver parceria paga,
              buscamos identificá-la de forma clara ao leitor.
            </p>

            <p className="font-bold text-[#0F0F0F]">Última atualização: 9 de outubro de 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
