// Textos de SEO da página /rota-biker, compartilhados entre o conteúdo visível
// (Explorer e MapGuide) e o JSON-LD (RotaBikerJsonLd). O FAQ visível e o
// FAQPage do JSON-LD precisam ter exatamente o mesmo texto.
//
// Ao conferir a lista oficial de novo, atualize UPDATED_ISO/UPDATED_LABEL,
// as contagens abaixo e as respostas do FAQ que citam números.

export const OFFICIAL_LIST_URL = 'https://monumentobikers.com.br/monumentos/';
export const OFFICIAL_RULES_URL = 'https://monumentobikers.com.br/conquistadores/';
export const REFERENCE_MAP_URL = 'https://www.google.com/maps/d/viewer?mid=1ZHPck3Yykbhc8M1GYPrCcKf5pajiTvk';

export const UPDATED_ISO = '2026-11-18';
export const UPDATED_LABEL = '18/11/2026';

export const META_DESCRIPTION = 'Mapa gratuito dos monumentos da Rota Biker no Brasil e no Paraguai. Planeje rotas com várias paradas, marque os locais visitados e use no celular.';

export const ROTA_BIKER_FAQ: { q: string; a: string }[] = [
  {
    q: 'Quantos monumentos tem a Rota Biker?',
    a: 'Em 18/11/2026, a lista oficial da Rota Biker tinha 46 monumentos numerados, no Brasil e no Paraguai. Cinco ainda estão em construção e não carimbam o passaporte (nº 40, 41, 42, 45 e 46), e o nº 02 está em atualização. A rota cresce o tempo todo, então confira a lista oficial antes de viajar.',
  },
  {
    q: 'Posso marcar um monumento em construção como visitado?',
    a: 'Não. No mapa, os monumentos que ainda não carimbam o passaporte aparecem com o ícone ✌️ branco tracejado e não podem ser marcados como visitados nem incluídos no roteiro. Eles são liberados assim que a lista oficial indicar que já carimbam.',
  },
  {
    q: 'Qual é o site oficial da Rota Biker?',
    a: 'O site oficial é o monumentobikers.com.br, onde ficam a lista dos monumentos e o mapa de referência. A Rota Biker é mantida pela Associação dos Guardiões dos Monumentos Bikers. O mapa do Estrada a Dois é uma ferramenta independente e gratuita que usa esses pontos para planejar viagens e marcar visitas.',
  },
  {
    q: 'Onde ficam os monumentos da Rota Biker?',
    a: 'A maior parte fica no Sul e no Sudeste. São Paulo tem 14 monumentos, o Paraná 8, Santa Catarina 7, o Rio Grande do Sul 6 e Minas Gerais 4. Goiás tem 2, e Bahia, Distrito Federal, Paraíba e Paraguai têm 1 cada.',
  },
  {
    q: 'Quais monumentos da Rota Biker ficam em São Paulo?',
    a: 'São Paulo tem 14 monumentos: Parada 261 (Guapiara), Centro Cultural Movimento (Socorro), Bar Original – Pier SP-270 (Piraju), Box 1200 Concept (Jundiaí), Rancho Terra Crua (Salesópolis), Bar do Hélio (Santo Antônio da Alegria), Os Independentes (Barretos), Restaurante Pedra do Baú (São Bento do Sapucaí), Hotel Barra Bonita (Barra Bonita), Rancho Gastronomia e Cultura (São José do Barreiro), Zapata Garage (Garça), Lanchonete Parada da Búfala (Sete Barras), Laranja Doce – Pão com Linguiça (Martinópolis) e Empório Caconde (Caconde, em construção).',
  },
  {
    q: 'Quais monumentos da Rota Biker ficam no Paraná?',
    a: "O Paraná tem 8 monumentos: Serpenteando Café (Bocaiúva do Sul), do fundador da Rota Biker, Parada Rota 218 (Carlópolis), Posto Rota 090 (Piraí do Sul), Rota 513 (Ponta Grossa), Pro Tork (Siqueira Campos), Hell's Dogs Motorcycle Bar (Foz do Iguaçu), MAPY (Mauá da Serra) e Cervejaria Dolomitas (Tapejara, em construção).",
  },
  {
    q: 'Quais monumentos da Rota Biker ficam em Santa Catarina?',
    a: 'Santa Catarina tem 7 monumentos: Mirante 12 (Lauro Müller), Rota 370 (Urubici), Parada Rota Bike Café (Rio dos Cedros), Container da Serra (Doutor Pedrinho), Parada Penhasco (Penha), Pousada e Camping Poço do Caixão (Timbé do Sul) e Restaurante Portal Grill (Porto União).',
  },
  {
    q: 'Onde comprar o passaporte da Rota Biker?',
    a: 'Pelas regras oficiais, o passaporte é comprado em um dos estabelecimentos onde fica um monumento da Rota Biker. Em cada monumento você carimba o passaporte e, com todos os carimbos válidos, preenche o formulário de Conquistador no site oficial para pedir a validação. Vale ligar antes para confirmar se o local tem passaporte disponível.',
  },
  {
    q: 'O mapa da Rota Biker é grátis?',
    a: 'Sim. Você pode consultar os pontos, planejar viagens e marcar visitas gratuitamente. O login é opcional e permite acessar as marcações da sua conta em outros dispositivos.',
  },
  {
    q: 'Posso instalar no Android e no iPhone?',
    a: 'Sim. No celular, toque em “Instalar Rota Biker” e siga as orientações. No Android, a opção também pode aparecer no menu do navegador. No iPhone, abra no Safari e use Compartilhar → Adicionar à Tela de Início.',
  },
  {
    q: 'Preciso de internet para usar?',
    a: 'Sim. O mapa, o cálculo das distâncias e a sincronização das visitas precisam de conexão. Adicionar o ícone à tela inicial facilita o acesso, mas não torna o mapa disponível offline.',
  },
  {
    q: 'As marcações substituem o passaporte físico?',
    a: 'Não. Esta é uma ferramenta independente do Estrada a Dois. As marcações servem para seu controle pessoal, não validam carimbos e não substituem o passaporte ou as conquistas oficiais da Rota Biker.',
  },
];
