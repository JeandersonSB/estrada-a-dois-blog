import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { OFFICIAL_LIST_URL, OFFICIAL_RULES_URL, ROTA_BIKER_FAQ } from './seo';

// Tutorial do mapa no YouTube: https://youtu.be/I-7Q-FWERXg
const TUTORIAL_VIDEO_ID = 'I-7Q-FWERXg';

export default function MapGuide() {
  return <section className="biker-guide" aria-labelledby="biker-guide-title">
    {/* Logo abaixo da caixa de aviso que fecha o mapa (Explorer). */}
    <div className="biker-stamp-alert" role="note">
      <svg className="biker-stamp-alert-icon" viewBox="0 0 64 60" fill="none" aria-hidden="true"><path d="M27 7c2.2-4 7.8-4 10 0l24 43c2.2 4-0.7 8-5 8H8c-4.3 0-7.2-4-5-8L27 7Z" fill="#9FD131" stroke="#4A7310" strokeWidth="3" strokeLinejoin="round"/><path d="M32 21v15" stroke="#242323" strokeWidth="6" strokeLinecap="round"/><circle cx="32" cy="46" r="3.5" fill="#242323"/></svg>
      <p><strong>Importante:</strong> <span>o mapa não substitui os carimbos do passaporte.</span></p>
      <svg className="biker-stamp-alert-passport" viewBox="0 0 48 60" fill="none" aria-hidden="true"><rect x="3" y="3" width="42" height="54" rx="5" fill="#9FD131" stroke="#4A7310" strokeWidth="3"/><path d="M9 3v54" stroke="#4A7310" strokeWidth="3"/><circle cx="27" cy="25" r="10" stroke="#242323" strokeWidth="3"/><path d="M17 25h20M27 15c-4 5-4 15 0 20M27 15c4 5 4 15 0 20" stroke="#242323" strokeWidth="2.2"/><path d="M18 44h18M21 50h12" stroke="#242323" strokeWidth="3" strokeLinecap="round"/></svg>
    </div>
    <section className="biker-guide-video biker-guide-video-top" aria-labelledby="biker-video-title">
      <span className="biker-eyebrow">TUTORIAL EM VÍDEO</span>
      <h3 id="biker-video-title">Veja o mapa na prática</h3>
      <p>Assista ao passo a passo: como escolher a origem, adicionar paradas, abrir a navegação e salvar seus monumentos visitados.</p>
      <YouTubeEmbed id={TUTORIAL_VIDEO_ID} title="Mapa da Rota Biker: como usar e montar seu roteiro de moto (tutorial completo)" />
    </section>
    <details className="biker-howto">
    <summary><h2 id="biker-guide-title">Como usar o mapa da Rota Biker</h2></summary>
    <div className="biker-howto-body">
    <p>Encontre monumentos, organize suas paradas e acompanhe os lugares que você já conheceu.</p>
    <div className="biker-guide-grid">
      <article><h3>1. Escolha sua origem</h3><p>Abra “Planejar viagem”. Use sua localização atual, permitindo o acesso quando solicitado, ou digite uma cidade ou endereço. Ao digitar, localize e selecione o resultado para confirmar o ponto de partida.</p></article>
      <article><h3>2. Adicione suas paradas</h3><p>Escolha os monumentos na lista do planejador ou toque em um ponto no mapa e use “Adicionar ao roteiro”. As paradas ficam numeradas. Você pode mudar a ordem, remover pontos e incluir a volta à origem. O limite é de 10 locais, contando origem e destino.</p></article>
      <article><h3>3. Abra a navegação</h3><p>Envie o roteiro ao Google Maps. Se necessário, abra os trechos indicados pelo planejador. No Waze, navegue até uma parada por vez. Adicionar um ponto ao roteiro não o marca como visitado.</p></article>
    </div>
    <div className="biker-guide-grid biker-guide-pair">
      <article><h3>Como funcionam as distâncias?</h3><p>As estimativas são calculadas pelas estradas. A primeira parada usa a origem como referência; as seguintes consideram a última parada adicionada. Na lista do planejador, os pontos ainda não visitados aparecem primeiro, do mais próximo ao mais distante dessa referência. Os visitados ficam ao final, com ✅.</p><p>Ao reorganizar as paradas, as distâncias são recalculadas. Os valores podem diferir do navegador por causa do trajeto escolhido e das condições da viagem. Confira o percurso antes de sair.</p></article>
      <article><h3>Como salvar os locais visitados?</h3><p>Toque no monumento e escolha “Marcar como visitado”: o ponto fica verde. Para desfazer, use o botão vermelho “Desmarcar visitado”.</p><p>Sem login, as marcações ficam apenas neste navegador e podem ser perdidas ao limpar seus dados. Ao entrar com Google, você acessa as marcações da sua conta em outros dispositivos. Entre antes de começar: as marcações locais não são transferidas automaticamente para a conta.</p><p>O roteiro planejado fica disponível enquanto a página estiver aberta; ele não é salvo junto com suas visitas.</p></article>
    </div>
    </div>
    </details>
    <details className="biker-howto">
    <summary><h2>Dúvidas frequentes</h2></summary>
    <div className="biker-howto-body">
    {/* Mesmo texto do FAQPage no JSON-LD (RotaBikerJsonLd). */}
    {ROTA_BIKER_FAQ.map(({ q, a }) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
    </div>
    </details>
    {/* Aviso de ferramenta independente (veio do rodapé do mapa). */}
    <div className="biker-independent-notice"><svg className="biker-notice-icon" viewBox="0 0 64 60" fill="none" aria-hidden="true"><path d="M27 7c2.2-4 7.8-4 10 0l24 43c2.2 4-0.7 8-5 8H8c-4.3 0-7.2-4-5-8L27 7Z" fill="#9FD131" stroke="#4A7310" strokeWidth="3" strokeLinejoin="round"/><path d="M32 21v15" stroke="#242323" strokeWidth="6" strokeLinecap="round"/><circle cx="32" cy="46" r="3.5" fill="#242323"/></svg><p>Este mapa é uma ferramenta independente do Estrada a Dois, criada para ajudar cada viajante a manter seu controle online dos monumentos que já visitou. Os direitos sobre a Rota Biker, sua marca e identidade pertencem aos seus respectivos idealizadores e titulares. Como participante e divulgador do movimento, o Estrada a Dois quer contribuir, somar e facilitar a vida de quem vive a estrada. Esta página não é um serviço oficial da Rota Biker e suas marcações não substituem o passaporte físico nem validam carimbos ou conquistas oficiais.</p></div>
    <p className="biker-guide-sources">Fontes: <a href={OFFICIAL_LIST_URL} target="_blank" rel="noopener">lista oficial de monumentos</a> e <a href={OFFICIAL_RULES_URL} target="_blank" rel="noopener">regras do passaporte e dos Conquistadores</a>, no site da Rota Biker.</p>
  </section>;
}
