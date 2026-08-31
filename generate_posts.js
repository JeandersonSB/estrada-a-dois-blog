const fs = require('fs');
const path = require('path');

const posts = [
  { slug: 'rota-romantica-rs', title: 'Como planejar a Rota Romântica no RS de moto', cat: 'Roteiros', img: 'post-1.jpg' },
  { slug: 'como-escolher-capacete', title: 'O guia definitivo para escolher o capacete ideal', cat: 'Equipamentos', img: 'post-2.jpg' },
  { slug: 'dicas-de-pilotagem-chuva', title: 'Dicas de ouro para pilotar com segurança na chuva', cat: 'Dicas', img: 'post-3.jpg' },
  { slug: 'revisao-completa-antes-da-viagem', title: 'Revisão completa: o que checar na moto antes de viajar', cat: 'Manutenção', img: 'post-4.jpg' },
  { slug: 'roteiro-serra-do-rio-do-rastro', title: 'Desbravando a Serra do Rio do Rastro a Dois', cat: 'Roteiros', img: 'post-5.jpg' },
  { slug: 'comunicador-intercom-vale-a-pena', title: 'Intercomunicadores de capacete: vale mesmo a pena?', cat: 'Equipamentos', img: 'post-6.jpg' },
  { slug: 'o-que-levar-no-bau', title: 'O famoso Tetris: o que levar e como organizar o baú', cat: 'Dicas', img: 'post-7.jpg' },
  { slug: 'viagem-para-o-atacama', title: 'Planejamento financeiro para cruzar o Atacama', cat: 'Roteiros', img: 'post-8.jpg' },
  { slug: 'troca-de-oleo-na-estrada', title: 'Como e quando trocar o óleo no meio de uma longa viagem', cat: 'Manutenção', img: 'post-9.jpg' },
  { slug: 'viajar-com-garupa', title: 'Como é a vida na estrada com garupa: parceria acima de tudo', cat: 'Dicas', img: 'post-10.jpg' }
];

posts.forEach((p, i) => {
  const content = `---
title: "${p.title}"
date: "2026-08-${String(30 - i).padStart(2, '0')}"
category: "${p.cat}"
image: "/images/blog/${p.img}"
excerpt: "Confira nossa experiência e as melhores dicas sobre ${p.title.toLowerCase()} para garantir que a sua viagem seja inesquecível e sem perrengues."
---

## A Importância do Planejamento

Viajar de moto é mais do que ir de um ponto A ao B. É **viver a estrada**. Neste post, nós vamos detalhar tudo o que você precisa saber sobre o assunto. O planejamento não corta a aventura, ele *garante* que você tenha a paz de espírito para aproveitar cada paisagem!

### Nossa Experiência

Na última vez que pegamos a estrada para enfrentar esse roteiro, o Jeanderson fez questão de revisar cada detalhe da nossa moto, enquanto a Ana Paula cuidava da rota e de encontrar os melhores pontos para as fotos. 

![Imagem ilustrativa](/images/blog/${p.img})

### 3 Dicas Essenciais
1. **Paciência:** A viagem a dois exige parceria e sintonia.
2. **Segurança:** Nunca abra mão de bons equipamentos e revisão em dia.
3. **Liberdade:** Deixe um espaço no roteiro para imprevistos e boas surpresas.

> "O caminho também faz parte da viagem."
`;
  fs.writeFileSync(path.join('content/posts', `${p.slug}.md`), content, 'utf8');
});
console.log('10 posts criados com sucesso.');
