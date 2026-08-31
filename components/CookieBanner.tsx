'use client';
import { useState, useEffect } from 'react';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user already accepted cookies
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0F0F0F] text-[#D9D9D9] border-t-4 border-[#B6D200] p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] z-[100]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        <div className="text-sm md:text-base">
          <p className="font-bold text-white mb-1">Nós usamos cookies para melhorar sua experiência.</p>
          <p className="text-gray-400">
            Utilizamos cookies essenciais e tecnologias semelhantes para personalizar conteúdo, anúncios (via Google AdSense) e analisar nosso tráfego. 
            Ao continuar navegando, você concorda com a nossa <a href="/politica-de-privacidade" className="text-[#B6D200] hover:underline whitespace-nowrap">Política de Privacidade</a>.
          </p>
        </div>

        <button 
          onClick={acceptCookies}
          className="w-full md:w-auto px-8 py-3 bg-[#B6D200] hover:bg-[#8ac200] text-[#0F0F0F] font-black uppercase tracking-widest rounded-lg transition-colors whitespace-nowrap"
        >
          Aceitar e Continuar
        </button>
      </div>
    </div>
  );
}
