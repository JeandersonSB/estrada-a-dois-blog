'use client';

import { useRef, useState } from 'react';
import { filterMonumentGuide, type MonumentGuideSections } from '@/lib/monument-guide';

export function MonumentGuideSearch({ sections, className }: { sections: MonumentGuideSections; className: string }) {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const results = filterMonumentGuide(sections.entries, query);

  return <div className={className}>
    <div dangerouslySetInnerHTML={{ __html: sections.beforeHtml }} />
    <div className="not-prose my-8 rounded-2xl border border-[#cbd69e] bg-[#f1f6df] p-5 md:p-6" role="search" aria-label="Buscar monumentos neste guia">
      <label htmlFor="monument-guide-search" className="block text-lg font-bold text-[#0F0F0F]">Buscar monumento neste guia</label>
      <p id="monument-guide-search-help" className="mt-2 text-sm leading-relaxed text-gray-700">Busque pelo número do monumento, nome do local, cidade ou estado.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input ref={input} id="monument-guide-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: 13, Portal Grill, Ponta Grossa ou Paraná" aria-describedby="monument-guide-search-help" aria-controls="monument-guide-results" className="min-w-0 flex-1 rounded-lg border border-gray-400 bg-white px-4 py-3 text-base text-[#0F0F0F] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#627200]" />
        <button type="button" disabled={!query} onClick={() => { setQuery(''); input.current?.focus(); }} className="min-h-12 shrink-0 rounded-lg bg-[#B6D200] px-5 py-3 text-sm font-bold text-[#0F0F0F] outline-offset-2 hover:bg-[#a3bd00] focus-visible:outline-2 focus-visible:outline-[#627200] disabled:cursor-default disabled:opacity-50">Limpar busca</button>
      </div>
      <p className="mt-3 text-sm font-medium text-gray-700" role="status" aria-live="polite" aria-atomic="true">{results.length} de {sections.entries.length} fichas · Ordem crescente</p>
    </div>
    <div id="monument-guide-results">
      {results.map(entry => <section key={entry.number} aria-label={entry.title} dangerouslySetInnerHTML={{ __html: entry.html }} />)}
      {results.length === 0 && <p role="status">Nenhum monumento encontrado para “{query}”. Tente outro nome, número ou cidade, ou limpe a busca.</p>}
    </div>
    <div dangerouslySetInnerHTML={{ __html: sections.afterHtml }} />
  </div>;
}
