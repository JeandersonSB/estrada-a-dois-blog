import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política Editorial | Estrada a Dois',
  description: 'Conheça os critérios de fontes, revisão, correções e experiência prática usados pelo Estrada a Dois.',
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
              O <strong>Estrada a Dois</strong> é um projeto editorial dedicado ao motociclismo, mototurismo e à
              experiência de viajar de moto a dois. Nosso objetivo é publicar conteúdo útil, verificável e
              contextualizado para quem vive ou pretende viver a estrada.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">1. Fontes e apuração</h2>
            <p>
              Para notícias, especificações técnicas e informações de mercado, priorizamos fabricantes, órgãos
              oficiais, documentos técnicos e veículos especializados reconhecidos. Quando uma informação depende de
              fonte externa, buscamos identificá-la no próprio artigo e confrontar dados relevantes sempre que possível.
            </p>
            <p>
              Rumores, flagras e informações ainda não confirmadas são tratados como tal. Não apresentamos expectativa,
              projeção ou especulação como fato confirmado.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">2. Revisão humana antes da publicação</h2>
            <p>
              Todo conteúdo destinado ao portal passa por revisão editorial antes de ser publicado. A revisão verifica
              clareza, coerência, atualidade, duplicidade de pauta, informações técnicas, links, imagens e adequação ao
              perfil do Estrada a Dois.
            </p>
            <p>
              Notícias semelhantes não devem ser publicadas apenas por terem títulos ou fontes diferentes. Quando uma
              nova informação trata essencialmente do mesmo fato, preferimos atualizar, ampliar ou consolidar a matéria
              existente.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">3. Valor editorial próprio</h2>
            <p>
              Em conteúdos baseados em fatos noticiados por terceiros, procuramos acrescentar contexto para o
              motociclista brasileiro, como disponibilidade no país, concorrentes, posicionamento de mercado,
              implicações práticas, diferenças técnicas e informações que ajudem o leitor a compreender por que aquela
              novidade importa.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">4. Roteiros e experiências de viagem</h2>
            <p>
              Os artigos de roteiro e Diário de Bordo são construídos a partir de experiências reais do Estrada a Dois.
              Neles, registramos percursos realizados, condições observadas, custos, paradas, hospedagens, aprendizados,
              fotografias e situações vividas durante as viagens.
            </p>
            <p>
              Como estradas, preços, horários, regras de fronteira e condições climáticas mudam, recomendamos que o
              leitor confirme informações operacionais em fontes oficiais antes de repetir um roteiro.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">5. Equipamentos, manutenção e segurança</h2>
            <p>
              Guias de equipamentos e manutenção têm finalidade informativa. Sempre que houver procedimento crítico,
              orientamos a consulta ao manual do fabricante e, quando apropriado, a execução por profissional
              qualificado. Segurança tem prioridade sobre conveniência ou economia.
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

            <p className="font-bold text-[#0F0F0F]">Última atualização: 22 de setembro de 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
