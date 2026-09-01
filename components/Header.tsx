'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const CROWN_SRC = '/images/coroa-estrada-a-dois.png';

export function Header() {
  const [hoveredTarget, setHoveredTarget] = useState('logo');
  const [crownPos, setCrownPos] = useState({ top: 0, left: 0, opacity: 0, rotate: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const headerRef = useRef<HTMLDivElement>(null);
  const targetsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  const updateCrownPosition = useCallback(() => {
    // Only update crown position on desktop, mobile has no crown animation
    if (window.innerWidth < 768) {
      setCrownPos(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const targetEl = targetsRef.current[hoveredTarget];
    const parentEl = headerRef.current;
    
    if (targetEl && parentEl) {
      let top = targetEl.offsetTop;
      let left = targetEl.offsetLeft;
      let rotate = 0;

      if (hoveredTarget === 'logo') {
        // Place crown partially behind the left side of 'E', slightly lower
        top -= 12; // Move up to align with the E
        left -= 28; // Move left to peek out from behind
        rotate = -12;
      } else {
        // Place crown at the bottom-left of the menu item text
        top -= 18; // Move up to align with the menu text
        left -= 18; // Move closer to the text
        rotate = -15;
      }

      setCrownPos({ top, left, opacity: 1, rotate });
    }
  }, [hoveredTarget]);

  useEffect(() => {
    updateCrownPosition();
    window.addEventListener('resize', updateCrownPosition);
    const t = setTimeout(updateCrownPosition, 500);
    return () => {
      window.removeEventListener('resize', updateCrownPosition);
      clearTimeout(t);
    };
  }, [updateCrownPosition]);

  const navLinks = [
    { name: 'NOTÍCIAS', href: '/categoria/noticias', id: 'noticias' },
    { name: 'SOBRE', href: '/sobre', id: 'sobre' },
    { name: 'ROTEIROS', href: '/categoria/roteiros', id: 'roteiros' },
    { name: 'DICAS', href: '/categoria/dicas', id: 'dicas' },
    { name: 'MANUTENÇÃO', href: '/categoria/manutencao', id: 'manutencao' },
    { name: 'EQUIPAMENTOS', href: '/categoria/equipamentos', id: 'equipamentos' },
    { name: 'CONTATO', href: '/contato', id: 'contato' },
  ];

  return (
    <header className="bg-[#ffffff] shadow-sm sticky top-0 z-50 relative">
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center relative" ref={headerRef}>
        
        {/* Crown element - z-0 to stay behind text (Hidden on Mobile) */}
        <img 
          src={CROWN_SRC} 
          alt="Coroa" 
          className="hidden md:block absolute top-0 left-0 w-[42px] pointer-events-none transition-all duration-300 ease-out z-0"
          style={{ 
            transform: `translate(${crownPos.left}px, ${crownPos.top}px) rotate(${crownPos.rotate}deg)`,
            opacity: crownPos.opacity 
          }}
        />

        {/* Logo Text */}
        <a 
          href="/" 
          className="font-brand text-[30px] md:text-[36px] hover:opacity-80 transition-opacity z-10 relative flex gap-[6px] md:gap-[8px] md:ml-6"
          ref={(el) => { targetsRef.current['logo'] = el; }}
          onMouseEnter={() => setHoveredTarget('logo')}
          style={{ letterSpacing: '0.01em', lineHeight: 1 }}
        >
          <span className="text-[#0F0F0F] font-black italic">Estrada</span> 
          <span className="text-[#B6D200] font-black italic">a Dois</span>
        </a>
        
        {/* Desktop Navigation */}
        <nav 
          className="space-x-8 text-[15px] font-bold text-[#555555] hidden md:flex z-10"
          onMouseLeave={() => setHoveredTarget('logo')}
        >
          {navLinks.map((link) => (
            <a 
              key={link.id}
              href={link.href}
              className="hover:text-[#0F0F0F] transition-colors relative z-10 pl-2"
              ref={(el) => { targetsRef.current[link.id] = el; }}
              onMouseEnter={() => setHoveredTarget(link.id)}
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Mobile Hamburger Button */}
        <button 
          className="md:hidden text-[#0F0F0F] p-2 focus:outline-none z-10"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Abrir Menu"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 top-full flex flex-col py-4 z-40">
          {navLinks.map((link) => (
            <a 
              key={link.id}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-6 py-4 text-[#555555] font-bold hover:text-[#0F0F0F] hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
