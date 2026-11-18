// Pino do mapa da Rota Biker na identidade do Estrada a Dois (manual, p. 18):
// gota com contorno asfalto; verde = a visitar, asfalto + ✓ = visitado.
// O ✌️ (cumprimento biker) é desenho próprio, em traço simples e cantos
// arredondados, não o ícone oficial da Rota Biker.
// Indisponível (ainda não carimba): branco com contorno tracejado, para
// diferenciar também pela forma, não só pela cor.

export type PinState = 'disponivel' | 'visitado' | 'indisponivel';

const ASFALTO = '#1C1C1C';
const VERDE = '#9FD131';
const PEDRA = '#5E5E5A';

const DROP = 'M15 1.6C7.6 1.6 2 7.2 2 14.4c0 8.6 10.4 18.2 12.1 19.7.5.4 1.3.4 1.8 0C17.6 32.6 28 23 28 14.4 28 7.2 22.4 1.6 15 1.6Z';

function hand(color: string, cut: string) {
  return `<g transform="translate(5.8 4.8) scale(.78)">`
    + `<path d="M9.4 12.4 7.2 4" stroke="${color}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M14 12.4 16.6 4.2" stroke="${color}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<rect x="6.6" y="10.8" width="10.8" height="9.6" rx="3.5" fill="${color}"/>`
    + `<path d="M11.8 14.7h3.6M11.8 17.5h3.2" stroke="${cut}" stroke-width="1.2" stroke-linecap="round"/>`
    + `<path d="M7.9 14.5c1.5-.3 3.1.3 3.5 1.9" stroke="${cut}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`
    + `</g>`;
}

export function pinSvg(state: PinState) {
  const s = state === 'visitado'
    ? { fill: ASFALTO, line: ASFALTO, hand: VERDE, dash: '' }
    : state === 'indisponivel'
      ? { fill: '#FFFFFF', line: PEDRA, hand: PEDRA, dash: ' stroke-dasharray="3 2.4"' }
      : { fill: VERDE, line: ASFALTO, hand: ASFALTO, dash: '' };
  const check = state === 'visitado'
    ? `<circle cx="24.6" cy="6" r="5.3" fill="${VERDE}" stroke="${ASFALTO}" stroke-width="1.6"/><path d="m22.1 6.1 1.7 1.7 3.3-3.4" stroke="${ASFALTO}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 36" width="30" height="36" fill="none" aria-hidden="true">`
    + `<path d="${DROP}" fill="${s.fill}" stroke="${s.line}" stroke-width="2" stroke-linejoin="round"${s.dash}/>`
    + hand(s.hand, s.fill) + check + `</svg>`;
}
