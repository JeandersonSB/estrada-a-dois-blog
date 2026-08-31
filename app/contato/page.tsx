import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contato | Estrada a Dois',
  description: 'Fale com a gente! Dúvidas, parcerias ou apenas para trocar uma ideia sobre viagens de moto.',
};

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

export default function Contato() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-20">
      
      {/* HEADER BANNER */}
      <section className="w-full bg-[#0F0F0F] pt-16 pb-24 border-b-[8px] border-[#B6D200]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-white mb-4">
            Vamos <span className="text-[#B6D200]">Conversar?</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Seja para parcerias comerciais, dúvidas sobre rotas, ou apenas para trocar ideia sobre motos e viagens. A estrada é de todos nós!
          </p>
        </div>
      </section>

      {/* CONTENT GRID */}
      <section className="max-w-6xl mx-auto px-4 mt-[-40px] relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CONTACT FORM (UI Only) */}
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-black text-[#0F0F0F] uppercase mb-6">Envie uma mensagem</h2>
            
            <form className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nome</label>
                <input 
                  type="text" 
                  id="name" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors"
                  placeholder="Como você se chama?"
                />
              </div>
              
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">WhatsApp</label>
                <input 
                  type="tel" 
                  id="whatsapp" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Assunto</label>
                <select 
                  id="subject" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors bg-white"
                >
                  <option>Dúvida sobre roteiro / viagem</option>
                  <option>Parceria Comercial (Marcas)</option>
                  <option>Mídia Kit / Imprensa</option>
                  <option>Outro</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Mensagem</label>
                <textarea 
                  id="message" 
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors resize-none"
                  placeholder="Escreva sua mensagem aqui..."
                ></textarea>
              </div>
              
              <button 
                type="button" 
                className="w-full bg-[#0F0F0F] hover:bg-[#B6D200] hover:text-black text-white font-black uppercase tracking-widest py-4 rounded-lg transition-colors"
              >
                Enviar Mensagem
              </button>
            </form>
          </div>

          {/* CONTACT INFO DIRECT */}
          <div className="flex flex-col space-y-8">
            
            {/* Direct Contact Card */}
            <div className="bg-[#0F0F0F] p-8 md:p-12 rounded-2xl shadow-xl text-white">
              <h3 className="text-2xl font-black italic uppercase text-[#B6D200] mb-6">Contato Direto</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">E-mail Comercial</p>
                  <a href="mailto:jeandeerson@gmail.com" className="text-lg font-bold hover:text-[#B6D200] transition-colors">
                    jeandeerson@gmail.com
                  </a>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Redes Sociais</p>
                  <div className="flex flex-col space-y-4 mt-4">
                    <a href="#" className="font-bold text-gray-300 hover:text-[#E1306C] transition-colors flex items-center group">
                      <InstagramIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                      @estrada.a.dois
                    </a>
                    <a href="#" className="font-bold text-gray-300 hover:text-[#FF0000] transition-colors flex items-center group">
                      <YouTubeIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                      Estrada a Dois
                    </a>
                    <a href="#" className="font-bold text-gray-300 hover:text-[#00f2fe] transition-colors flex items-center group">
                      <TikTokIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                      @estradaadois
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Partnerships Banner */}
            <div className="bg-[#B6D200] p-8 md:p-12 rounded-2xl shadow-xl text-black">
              <h3 className="text-2xl font-black italic uppercase mb-4">Para Marcas</h3>
              <p className="font-medium mb-6">
                Temos forte potencial multimídia e trabalhamos com parcerias, reviews de equipamentos de motociclismo, roteiros patrocinados e divulgações.
              </p>
              <button className="bg-black text-white font-bold uppercase tracking-wider py-3 px-6 rounded-lg hover:bg-zinc-800 transition-colors text-sm flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Baixar Mídia Kit (PDF)
              </button>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
