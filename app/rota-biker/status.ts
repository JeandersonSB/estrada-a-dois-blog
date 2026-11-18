// Situação de cada monumento, conferida na lista oficial
// (https://monumentobikers.com.br/monumentos/):
// - carimbando: monumento pronto e carimbando o passaporte;
// - fase_final: aguardando inauguração, mas já carimba (contato antes);
// - em_construcao: na fila para construção, ainda NÃO carimba.
// Só monumentos que carimbam podem ser marcados como visitados ou entrar no roteiro.

export type MonumentStatus = 'carimbando' | 'fase_final' | 'em_construcao';

export function canStamp(m: { status: string }) {
  return m.status === 'carimbando' || m.status === 'fase_final';
}

export const STATUS_TEXT: Record<MonumentStatus, string> = {
  carimbando: 'Pronto e carimbando o passaporte',
  fase_final: 'Fase final de implantação: já carimba o passaporte. Entre em contato antes de visitar.',
  em_construcao: 'Em construção: ainda não carimba o passaporte. Por isso não dá para marcar como visitado nem incluir no roteiro.',
};
