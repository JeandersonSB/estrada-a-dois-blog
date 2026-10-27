export interface MonumentGuideEntry {
  number: number;
  title: string;
  searchText: string;
  html: string;
}

export interface MonumentGuideSections {
  beforeHtml: string;
  entries: MonumentGuideEntry[];
  afterHtml: string;
}

const STATE_NAMES: Record<string, string> = {
  PR: 'Paraná', SC: 'Santa Catarina', SP: 'São Paulo', RS: 'Rio Grande do Sul',
  MG: 'Minas Gerais', GO: 'Goiás', DF: 'Distrito Federal Brasília',
  BA: 'Bahia', PB: 'Paraíba', PY: 'Paraguai Paraguay',
};

function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

// Split only this guide's monument section. If its structure changes, retain
// the original article rather than risk dropping editorial content.
export function splitMonumentGuide(html: string): MonumentGuideSections | null {
  const headings = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)];
  const start = headings.find(h => plainText(h[1]) === 'Monumentos da Rota Biker em ordem crescente');
  if (!start || start.index === undefined) return null;
  const end = headings.find(h => h.index! > start.index!);
  const endIndex = end?.index ?? html.length;
  const sectionStart = start.index + start[0].length;
  const section = html.slice(sectionStart, endIndex);
  const cards = [...section.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)];
  if (!cards.length) return null;
  const entries: MonumentGuideEntry[] = [];
  for (let i = 0; i < cards.length; i++) {
    const title = plainText(cards[i][1]);
    const match = title.match(/^(?:E o monumento nº\s*|Monumento\s+)(\d+)\b/i);
    if (!match) return null;
    const number = Number(match[1]);
    if (entries.some(entry => entry.number === number)) return null;
    const cardHtml = section.slice(cards[i].index!, cards[i + 1]?.index ?? section.length);
    // Search identity and location only: hours, neighbouring links and source
    // addresses must not cause unrelated monuments to match.
    const locationFields = [...cardHtml.matchAll(/<li><strong>(?:Cidade|Endereço[^<]*):<\/strong>([\s\S]*?)<\/li>/g)]
      .map(field => plainText(field[1])).join(' ');
    const states = Object.entries(STATE_NAMES)
      .filter(([code]) => new RegExp(`\\b${code}\\b`).test(locationFields))
      .map(([, name]) => name).join(' ');
    entries.push({ number, title, searchText: normalize(`${title} ${locationFields} ${states}`), html: cardHtml });
  }
  return {
    beforeHtml: html.slice(0, sectionStart + cards[0].index!),
    entries,
    afterHtml: html.slice(endIndex),
  };
}

export function filterMonumentGuide(entries: MonumentGuideEntry[], query: string): MonumentGuideEntry[] {
  const term = normalize(query).replace(/^#\s*/, '');
  if (!term) return entries;
  const numberMatch = term.match(/^(?:monumento\s*(?:n[ºo°.]?\s*)?)?0*(\d{1,2})$/);
  if (numberMatch) return entries.filter(entry => entry.number === Number(numberMatch[1]));
  if (STATE_NAMES[term.toUpperCase()]) {
    const stateTerm = term === 'py' ? 'paraguai' : term;
    return entries.filter(entry => entry.searchText.split(/\W+/).includes(stateTerm));
  }
  const words = term.split(/\s+/);
  return entries.filter(entry => words.every(word => entry.searchText.includes(word)));
}
