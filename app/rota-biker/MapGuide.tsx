export default function MapGuide() {
  return <section className="biker-guide" aria-labelledby="biker-guide-title">
    <span className="biker-eyebrow">PLANEJE SUA PRÓXIMA VIAGEM</span>
    <h2 id="biker-guide-title">Como usar o mapa da Rota Biker</h2>
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
    <section className="biker-guide-video" aria-labelledby="biker-video-title"><span className="biker-eyebrow">EM BREVE</span><h3 id="biker-video-title">Tutorial em vídeo: veja o mapa na prática</h3><p>Estamos preparando uma demonstração de como escolher a origem, adicionar paradas, abrir a navegação e salvar seus monumentos visitados. O vídeo será disponibilizado aqui.</p></section>
    <h2>Dúvidas frequentes</h2>
    <details><summary>O mapa da Rota Biker é grátis?</summary><p>Sim. Você pode consultar os pontos, planejar viagens e marcar visitas gratuitamente. O login é opcional e permite acessar as marcações da sua conta em outros dispositivos.</p></details>
    <details><summary>Posso instalar no Android e no iPhone?</summary><p>Sim. No celular, toque em “Instalar Rota Biker” e siga as orientações. No Android, a opção também pode aparecer no menu do navegador. No iPhone, abra no Safari e use Compartilhar → Adicionar à Tela de Início.</p></details>
    <details><summary>Preciso de internet para usar?</summary><p>Sim. O mapa, o cálculo das distâncias e a sincronização das visitas precisam de conexão. Adicionar o ícone à tela inicial facilita o acesso, mas não torna o mapa disponível offline.</p></details>
    <details><summary>As marcações substituem o passaporte físico?</summary><p>Não. Esta é uma ferramenta independente do Estrada a Dois. As marcações servem para seu controle pessoal, não validam carimbos e não substituem o passaporte ou as conquistas oficiais da Rota Biker.</p></details>
  </section>;
}
