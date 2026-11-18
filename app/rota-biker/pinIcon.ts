// Ícone ✌️ do mapa da Rota Biker, na identidade do Estrada a Dois.
// Desenho próprio do gesto (dedos em V, anelar e mindinho dobrados, polegar
// cruzando a palma), não o ícone oficial da Rota Biker.
// Cores do manual: verde = a visitar; asfalto + selo ✓ = visitado;
// branco com contorno tracejado em Pedra = em construção (não carimba).
// Os estados diferem também na forma (selo, tracejado), não só na cor.

export type PinState = 'disponivel' | 'visitado' | 'indisponivel';

const ASFALTO = '#1C1C1C';
const VERDE = '#9FD131';
const PEDRA = '#5E5E5A';
const BRANCO = '#FFFFFF';

// viewBox 0 0 64 64
const PALM = 'M17 31C13.5 36 12.6 44 14.6 50.4 17.4 57.6 24.6 61 32.4 60.6 41.4 60.1 48.4 54 48.6 45.2L48 33Z';
const FOLDED = [ // anelar e mindinho dobrados
  { x: 20, y: 24.5, w: 9.6, h: 20, r: 4.8 },
  { x: 12.6, y: 29, w: 8.8, h: 16.5, r: 4.4 },
];
const FINGERS = [[28.5, 33, 23.5, 7.5], [37.5, 33, 44.5, 8]]; // indicador e médio
const FINGER_WIDTH = 8.6;
const OUTLINE = 4.6;
const LINE = 2.6;
const THUMB = 'M48.3 38.8C42.4 36.6 34.6 37.2 29.4 41.2';

// Desenha as peças da silhueta numa cor. Com `extra`, engrossa o traço: a camada
// de contorno fica por baixo da de preenchimento, formando um contorno único.
function layer(color: string, extra = 0, dash = '') {
  const d = dash ? ` stroke-dasharray="${dash}"` : '';
  const stroke = extra ? ` stroke="${color}" stroke-width="${extra}" stroke-linejoin="round"${d}` : '';
  return FINGERS.map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${FINGER_WIDTH + extra}" stroke-linecap="round"${d}/>`).join('')
    + `<path d="${PALM}" fill="${color}"${stroke}/>`
    + FOLDED.map(f => `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="${f.r}" fill="${color}"${stroke}/>`).join('');
}

export function pinSvg(state: PinState) {
  const c = state === 'visitado'
    ? { fill: ASFALTO, outline: ASFALTO, inner: VERDE, dash: '' }
    : state === 'indisponivel'
      ? { fill: BRANCO, outline: PEDRA, inner: PEDRA, dash: '4.5 3.5' }
      : { fill: VERDE, outline: ASFALTO, inner: ASFALTO, dash: '' };
  const details = FOLDED.map(f => `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="${f.r}" fill="${c.fill}" stroke="${c.inner}" stroke-width="${LINE}"/>`).join('')
    + `<path d="${THUMB}" stroke="${c.fill}" stroke-width="${LINE + 4}" stroke-linecap="round" fill="none"/>`
    + `<path d="${THUMB}C31.4 43.6 32.2 46.6 31.8 50" stroke="${c.inner}" stroke-width="${LINE}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const check = state === 'visitado'
    ? `<circle cx="52" cy="14" r="9" fill="${VERDE}" stroke="${ASFALTO}" stroke-width="3"/><path d="m47.8 14.2 3 3 5.6-5.8" stroke="${ASFALTO}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="32" height="32" fill="none" aria-hidden="true">`
    + `<g transform="translate(3.2 0) scale(.9 1)">${layer(c.outline, OUTLINE * 2, c.dash)}${layer(c.fill)}${details}</g>`
    + check + `</svg>`;
}
