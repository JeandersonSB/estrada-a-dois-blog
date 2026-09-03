const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 group-hover:text-[#E1306C] text-[#D9D9D9]">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 group-hover:text-white group-hover:drop-shadow-[1px_1px_0px_#ff0050] text-[#D9D9D9]">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110 group-hover:text-[#FF0000] text-[#D9D9D9]">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-[#0F0F0F] text-[#D9D9D9] py-10 mt-auto border-t border-[#2B2B2B]">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center">
        
        {/* Square Logo 600x600 */}
        <img 
          src="/images/logo-estrada-a-dois-principal.png" 
          alt="Estrada a Dois Logo" 
          className="h-32 w-32 mb-6 object-contain drop-shadow-lg"
        />
        
        {/* Social Buttons - Horizontal */}
        <div className="flex flex-row flex-wrap justify-center w-full gap-4 mb-8">
          
          <a href="#" className="group relative flex items-center w-auto px-5 py-3 bg-[#121212] border border-[#333333] rounded-lg text-[#D9D9D9] font-medium text-[13px] tracking-wide overflow-hidden transition-all duration-300 hover:bg-[#1a1a1a] hover:border-[#555555] hover:text-white hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            <div className="absolute left-0 top-0 h-full w-[3px] bg-transparent transition-colors duration-300 group-hover:bg-[#E1306C]"></div>
            <div className="flex items-center justify-center w-[18px] h-[18px] mr-3">
              <InstagramIcon />
            </div>
            <span className="mr-4">Instagram</span>
            <span className="font-sans text-[1.1em] font-light text-white/20 transition-all duration-300 group-hover:text-white group-hover:translate-x-[2px] group-hover:-translate-y-[2px]">↗</span>
          </a>

          <a href="#" className="group relative flex items-center w-auto px-5 py-3 bg-[#121212] border border-[#333333] rounded-lg text-[#D9D9D9] font-medium text-[13px] tracking-wide overflow-hidden transition-all duration-300 hover:bg-[#1a1a1a] hover:border-[#555555] hover:text-white hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            <div className="absolute left-0 top-0 h-full w-[3px] bg-transparent transition-colors duration-300 group-hover:bg-[#FF0000]"></div>
            <div className="flex items-center justify-center w-[18px] h-[18px] mr-3">
              <YouTubeIcon />
            </div>
            <span className="mr-4">YouTube</span>
            <span className="font-sans text-[1.1em] font-light text-white/20 transition-all duration-300 group-hover:text-white group-hover:translate-x-[2px] group-hover:-translate-y-[2px]">↗</span>
          </a>

          <a href="#" className="group relative flex items-center w-auto px-5 py-3 bg-[#121212] border border-[#333333] rounded-lg text-[#D9D9D9] font-medium text-[13px] tracking-wide overflow-hidden transition-all duration-300 hover:bg-[#1a1a1a] hover:border-[#555555] hover:text-white hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            <div className="absolute left-0 top-0 h-full w-[3px] bg-transparent transition-colors duration-300 group-hover:bg-[#00f2fe]"></div>
            <div className="flex items-center justify-center w-[18px] h-[18px] mr-3">
              <TikTokIcon />
            </div>
            <span className="mr-4">TikTok</span>
            <span className="font-sans text-[1.1em] font-light text-white/20 transition-all duration-300 group-hover:text-white group-hover:translate-x-[2px] group-hover:-translate-y-[2px]">↗</span>
          </a>

        </div>

        <div className="flex flex-col items-center gap-2 mt-4 text-center">
          <p className="text-xs text-[#888888]">
            Contato & Parcerias:{' '}
            <a href="mailto:jeandeerson@gmail.com" className="text-[#B6D200] hover:underline font-medium">
              jeandeerson@gmail.com
            </a>
          </p>
          <p className="text-xs text-[#555555] tracking-widest uppercase">&copy; {new Date().getFullYear()} Estrada a Dois. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <a href="/politica-de-privacidade" className="text-xs text-[#555555] hover:text-white transition-colors underline decoration-[#555555] hover:decoration-white">
              Política de Privacidade
            </a>
            <span className="text-[#333333] text-xs">•</span>
            <a href="/contato" className="text-xs text-[#555555] hover:text-white transition-colors underline decoration-[#555555] hover:decoration-white">
              Contato
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
