import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Estrada a Dois',
  description: 'Política de Privacidade e Termos de Uso do blog Estrada a Dois.',
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
              A sua privacidade é importante para nós. É política do <strong>Estrada a Dois</strong> respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site <a href="https://estradaadois.com" className="text-[#B6D200] hover:underline">estradaadois.com</a>, e outros sites que possuímos e operamos.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">1. Informações que coletamos</h2>
            <p>
              Solicitamos informações pessoais (como nome e e-mail) apenas quando realmente precisamos delas para lhe fornecer um serviço, como ao assinar nossa newsletter ou preencher um formulário de contato. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.
            </p>
            <p>
              Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, os protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">2. Compartilhamento de dados</h2>
            <p>
              Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
            </p>
            <p>
              O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.
            </p>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">3. Uso de Cookies e Google AdSense</h2>
            <p>
              Utilizamos cookies para armazenar informações, como as suas preferências pessoais quando visita o nosso website. Isto poderá incluir um simples popup, ou uma ligação a vários serviços que providenciamos.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Fornecedores de terceiros, incluindo o Google, usam cookies para veicular anúncios com base em visitas anteriores do usuário ao nosso website ou a outros websites.
              </li>
              <li>
                O uso de cookies de publicidade pelo Google permite que ele e seus parceiros veiculem anúncios para os usuários com base na visita a nossos sites e/ou a outros sites na Internet.
              </li>
              <li>
                Os usuários podem desativar a publicidade personalizada visitando as <a href="https://myadcenter.google.com/" target="_blank" rel="noreferrer" className="text-[#B6D200] hover:underline">Configurações de anúncios do Google</a>.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">4. Compromisso do Usuário</h2>
            <p>
              O usuário se compromete a fazer uso adequado dos conteúdos e da informação que o <strong>Estrada a Dois</strong> oferece no site e com caráter enunciativo, mas não limitativo:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Não se envolver em atividades que sejam ilegais ou contrárias à boa fé e à ordem pública;</li>
              <li>Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, jogos de sorte ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</li>
              <li>Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) do Estrada a Dois, de seus fornecedores ou terceiros.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0F0F0F] uppercase mt-8">5. Mais informações</h2>
            <p>
              Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.
            </p>
            <p className="font-bold">
              Esta política é efetiva a partir de {new Date().toLocaleDateString('pt-BR')}.
            </p>
            <p>
              Para dúvidas adicionais, entre em contato através do e-mail: <strong>jeandeerson@gmail.com</strong>
            </p>

          </div>
        </div>
        
      </div>
    </div>
  );
}
