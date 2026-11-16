'use client';
import { useState } from 'react';
import Link from 'next/link';

const navLinks = [
  { name: 'ROTEIROS', href: '/categoria/roteiros', id: 'roteiros' },
  { name: 'ROTA BIKER', href: '/rota-biker', id: 'rota-biker' },
  { name: 'DICAS', href: '/categoria/dicas', id: 'dicas' },
  { name: 'EQUIPAMENTOS', href: '/categoria/equipamentos', id: 'equipamentos' },
  { name: 'MANUTENÇÃO', href: '/categoria/manutencao', id: 'manutencao' },
  { name: 'SOBRE', href: '/sobre', id: 'sobre' },
  { name: 'CONTATO', href: '/contato', id: 'contato' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#ffffff] shadow-sm sticky top-0 z-50 relative">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center relative">

        {/* Logo Text */}
        <Link
          href="/"
          aria-label="Estrada a Dois - página inicial"
          className="hover:opacity-80 transition-opacity z-10 relative md:ml-6 shrink-0"
        >
          <img
            src="/images/marca/logo-principal.svg"
            alt="Estrada a Dois"
            width={135}
            height={60}
            className="h-[56px] md:h-[60px] w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="space-x-4 xl:space-x-6 text-[13px] xl:text-[14px] font-bold text-[#333333] hidden lg:flex z-10">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className="hover:text-[#4A7310] transition-colors relative z-10 pl-2 whitespace-nowrap"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="lg:hidden text-[#1C1C1C] p-2 focus:outline-none z-10"
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
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 top-full flex flex-col py-4 z-40">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-6 py-4 text-[#555555] font-bold hover:text-[#4A7310] hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              {link.name}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
