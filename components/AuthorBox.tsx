import Link from 'next/link';

export const AUTHOR = {
  name: 'Jeanderson Batista',
  url: 'https://www.estradaadois.com/sobre',
  image: 'https://www.estradaadois.com/images/sobre/foto-jeanderson.webp',
  role: 'Publicitário, produtor audiovisual e piloto',
} as const;

export function AuthorBox() {
  return (
    <aside
      aria-label="Sobre o autor"
      className="mt-12 flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm"
    >
      <img
        src="/images/sobre/foto-jeanderson.webp"
        alt={`Foto de ${AUTHOR.name}`}
        width={96}
        height={96}
        loading="lazy"
        className="h-24 w-24 shrink-0 rounded-full object-cover border-4 border-[#B6D200]"
      />
      <div className="text-center sm:text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Escrito por</p>
        <p className="text-xl font-black text-[#0F0F0F]">{AUTHOR.name}</p>
        <p className="text-sm font-bold uppercase tracking-wider text-[#6f9a00] mb-3">{AUTHOR.role}</p>
        <p className="text-gray-600 leading-relaxed">
          A paixão pelas motos veio do pai, e a estrada virou parte da vida: já são mais de 200 mil km rodados.
          Viaja com a esposa, Ana Paula, e nas viagens cuida da pilotagem, das rotas, da manutenção e do famoso
          &quot;Tetris&quot; da bagagem.
        </p>
        <Link
          href="/sobre"
          className="mt-4 inline-flex items-center font-extrabold text-[#0F0F0F] hover:text-[#6f9a00] transition-colors"
        >
          Conheça o Estrada a Dois →
        </Link>
      </div>
    </aside>
  );
}
