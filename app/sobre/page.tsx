import type { Metadata } from 'next';
import Head from 'next/head';

export const metadata: Metadata = {
  title: 'Sobre Nós | Estrada a Dois',
  description: 'Conheça o casal Jeanderson e Ana Paula, criadores do Estrada a Dois. Uma paixão por mototurismo, planejamento e vida na estrada.',
};

export default function SobreNos() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      
      {/* HEADER BANNER WITH IMAGE */}
      <section className="w-full bg-[#0F0F0F] flex flex-col items-center pt-8 border-b-[8px] border-[#B6D200]">
        <div className="max-w-4xl w-full px-4 mb-[-2rem] relative z-10">
          <img 
            src="/images/sobre/capa-sobre-nos.webp" 
            alt="Sobre Nós - Estrada a Dois - Jeanderson e Ana Paula" 
            className="w-full h-auto min-h-[300px] bg-zinc-800 rounded-xl shadow-2xl object-cover border-4 border-white text-transparent"
          />
        </div>
      </section>

      {/* TEXT: ORIGIN & PURPOSE */}
      <section className="max-w-4xl mx-auto px-4 mt-16 pt-8 text-center">
        <h1 className="text-4xl md:text-5xl font-black italic uppercase text-[#0F0F0F] mb-6">
          A <span className="text-[#B6D200] drop-shadow-sm">Nossa</span> História
        </h1>
        <div className="prose prose-lg mx-auto text-[#555555] font-medium leading-relaxed space-y-6">
          <p>
            A <strong>Estrada a Dois</strong> nasceu como um projeto de casal para registrar, contar e compartilhar experiências reais de viagens de moto. Nós unimos a estrada, o relacionamento, a aventura, o planejamento e a produção de conteúdo em um único estilo de vida.
          </p>
          <p>
            A nossa essência é mostrar que viajar de moto não é apenas sair de um ponto ao outro. <strong>É viver a estrada</strong>, registrar memórias, conhecer lugares incríveis, superar desafios e, acima de tudo, inspirar outras pessoas a tirarem suas viagens do papel e colocá-las em prática.
          </p>
          <p>
            Liberdade, parceria, confiança e planejamento. É nisso que acreditamos.
          </p>
        </div>
      </section>

      {/* PROFILES (TWO COLUMNS) */}
      <section className="max-w-5xl mx-auto px-4 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Jeanderson Profile */}
          <div className="flex flex-col items-center transform transition duration-500 hover:-translate-y-2">
            <img 
              src="/images/sobre/foto-jeanderson.webp" 
              alt="Jeanderson - Piloto e Produtor Audiovisual" 
              className="w-full aspect-[4/5] object-cover bg-gray-200 rounded-2xl shadow-xl mb-6 border-2 border-gray-200 text-transparent"
            />
            <div className="text-center px-4">
              <h2 className="text-2xl font-black text-[#0F0F0F] uppercase">Jeanderson</h2>
              <p className="text-[#8ac200] font-bold text-sm uppercase tracking-widest mb-3">Publicitário • Produtor • Piloto</p>
              <p className="text-gray-600 text-sm">
                A paixão pelas motos veio do meu pai. Estimo já ter percorrido mais de 200 mil km. Nas viagens, cuido da pilotagem, das rotas, da manutenção e do famoso "Tetris" da bagagem.
              </p>
            </div>
          </div>

          {/* Ana Paula Profile */}
          <div className="flex flex-col items-center transform transition duration-500 hover:-translate-y-2">
            <img 
              src="/images/sobre/foto-ana-paula.webp" 
              alt="Ana Paula - Psicóloga e Capturadora de Histórias" 
              className="w-full aspect-[4/5] object-cover bg-gray-200 rounded-2xl shadow-xl mb-6 border-2 border-gray-200 text-transparent"
            />
            <div className="text-center px-4">
              <h2 className="text-2xl font-black text-[#0F0F0F] uppercase">Ana Paula</h2>
              <p className="text-[#8ac200] font-bold text-sm uppercase tracking-widest mb-3">Psicóloga • Futura Piloto</p>
              <p className="text-gray-600 text-sm">
                Foi com o Jeanderson que descobri as viagens de moto e me apaixonei mais pelo caminho do que pelo destino. Na estrada, ajudo nas hospedagens e registro as fotos e vídeos.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* MISSION BANNER */}
      <section className="max-w-5xl mx-auto px-4 mt-24">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#0F0F0F] flex flex-col md:flex-row items-center border-l-[12px] border-[#B6D200] min-h-[400px]">
          <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center z-10 relative">
            <h2 className="text-3xl md:text-4xl font-black text-white italic mb-6 leading-tight">
              Uma moto, <br/><span className="text-[#B6D200]">dois capacetes</span> <br/>e muita estrada.
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Compartilhamos rotas, custos, experiências e mostramos que grandes viagens não dependem apenas da moto, mas da sua vontade de viver o momento.
            </p>
            <a href="/categoria/roteiros" className="inline-flex items-center justify-center bg-[#B6D200] hover:bg-[#8ac200] text-black font-black uppercase tracking-wider py-4 px-8 rounded-lg transition-colors w-max">
              Explorar Roteiros
            </a>
          </div>
          <div className="w-full md:w-1/2 h-64 md:h-full md:absolute md:right-0 md:top-0">
             <img 
              src="/images/sobre/imagem-missao.webp" 
              alt="Casal Estrada a Dois" 
              className="w-full h-full object-cover bg-zinc-800 opacity-80 text-transparent"
            />
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="max-w-4xl mx-auto px-4 mt-24 mb-10 text-center">
        <h3 className="text-2xl font-black text-[#0F0F0F] uppercase mb-10">O que nos move</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-[#8ac200] font-black text-xl mb-3">Autenticidade</h4>
            <p className="text-gray-600 text-sm">Mostramos viagens reais, com nossos acertos, erros, perrengues, bastidores e aprendizados na estrada.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-[#8ac200] font-black text-xl mb-3">Parceria</h4>
            <p className="text-gray-600 text-sm">Reforçamos sempre a ideia de que viajar a dois exige cumplicidade, respeito, paciência e união.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h4 className="text-[#8ac200] font-black text-xl mb-3">Planejamento</h4>
            <p className="text-gray-600 text-sm">Valorizamos a aventura e a liberdade, mas sempre com muita responsabilidade, segurança e consciência.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
