# Rota Biker — primeira versão

Página `/rota-biker` no Next.js existente. Mapa Leaflet/OpenStreetMap, 43 pontos importados do KML público fornecido pelo proprietário em 19/10/2026. Não usa fotos nem perfis públicos. O arquivo monuments.json é uma fotografia da base; IDs derivam das coordenadas, portanto preserve IDs ao corrigir coordenadas de pontos existentes.

## Configuração para Google e sincronização

Criar projeto Firebase, habilitar Authentication > Google e Cloud Firestore. Cadastrar `estradaadois.com`, `www.estradaadois.com` e o domínio de preview usado em Authentication > Authorized domains. Configurar as variáveis públicas na hospedagem e reconstruir:

```
NEXT_PUBLIC_BIKER_FIREBASE_API_KEY=
NEXT_PUBLIC_BIKER_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_BIKER_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_BIKER_FIREBASE_APP_ID=
```

Aplicar o conteúdo de `firestore.rules` em Firebase Console > Firestore Database > Regras > Publicar. O arquivo no GitHub não publica regras automaticamente. A chave web pública Firebase não substitui as regras de acesso. Não colocar credenciais administrativas no navegador.

As regras permitem leitura direta, escrita e exclusão somente pelo dono do UID. Listagens são bloqueadas. O documento aceita exclusivamente o mapa `visits`, com os 43 IDs do catálogo e somente o valor booleano `true`; desmarcar continua removendo o campo. Novos IDs exigem executar `node scripts/generate-biker-rules.mjs`, testar e publicar novamente as regras. IDs existentes continuam estáveis, sem migração do histórico.

Sem configuração, marcações funcionam apenas no navegador. Ao entrar, o histórico da conta substitui o histórico local; não há importação automática. A sessão não escreve visitas de outra conta. Não existe coleta de localização até o usuário clicar em Minha localização ou abrir Planejar viagem. Cartão PNG 1080x1920 gerado localmente; gráfico de pontos esquemático, sem mapa-base.

## Planejamento e busca

Prévia de múltiplas paradas: origem pela geolocalização do navegador (posição sem cache, alta precisão e timeout de 15 segundos) ou cidade/endereço digitado. O endereço só é resolvido pelo Google Maps quando o usuário abre a navegação; não há serviço adicional de busca de endereços. O GPS é solicitado apenas pelo botão de localização, não ao abrir o planejador.

O roteiro comporta 10 locais no total: origem e até 9 monumentos, ou origem, até 8 monumentos e volta à origem. O usuário pode adicionar pelo seletor ou pelos detalhes do monumento, remover, subir/descer a ordem e limpar as paradas. Não há otimização automática da sequência. Escolher uma parada não altera as visitas nem o Firestore. A origem e a sequência ficam apenas no estado da página; fechar/recarregar limpa o planejamento.

As paradas são numeradas no mapa e permanecem visíveis mesmo quando a busca/filtro oculta outros pontos. A cor de visitado permanece independente. O seletor usa a distância crescente em linha reta apenas quando há localização atual; com endereço digitado, usa ordem alfabética. A distância é Haversine, explicitamente identificada, sem representar distância rodoviária.

Google Maps recebe origem, paradas intermediárias na ordem escolhida e destino final (ou origem no circuito). O botão principal abre o roteiro completo. A alternativa por etapas usa até três paradas intermediárias por link para navegadores móveis; a última posição de uma etapa é a primeira da próxima, preservando toda a sequência. Waze recebe somente o monumento escolhido no botão individual de cada parada e utiliza a própria localização para navegar. URLs só são geradas no clique, sem expor a origem em hrefs/Analytics. Não grava geolocalização em banco, analytics ou cartão.

Cidades, UF, nomes dos estados e números enriquecidos a partir da lista oficial https://monumentobikers.com.br/ em 19/10/2026; coordenadas preservadas do mapa original. IDs não mudaram, preservando marcações anteriores. Busca por nome, apelidos, cidade, estado, sigla, região, país e número, sem exigir acentos. Siglas e números usam palavras inteiras para evitar, por exemplo, PR corresponder a Prado ou número 1 corresponder a 12. Cajá é exibida como localidade conforme a lista oficial.

Marcadores existentes são recoloridos sem reconstruir a camada. Marcar uma visita no filtro de pendentes troca para Todos; desmarcar em Visitados também troca para Todos, mantendo o ponto visível.

## Validação manual após configurar

Entrar com Google em duas contas, marcar/desmarcar e recarregar; confirmar isolamento de dados e negação de leitura de outro UID pelas regras. Conferir sincronização em outro navegador. Conferir negação offline, popup bloqueado, localização recusada e mapa indisponível. Permitir localização no celular e verificar a ordenação crescente do select; selecionar um monumento e conferir Google Maps e Waze. Testar erro de permissão, timeout e nova tentativa. Marcar um ponto no filtro de pendentes e confirmar que permanece visível e verde. Baixar PNG e confirmar contador.

## Segurança e testes

Os botões de navegação geram a URL somente durante o clique. A origem privada não fica em um `href` que a medição automática de cliques externos do Analytics possa capturar. Os destinos continuam abrindo nos aplicativos escolhidos, mediante ação do usuário.

Ao recusar Analytics, o site define `ga-disable-G-1MTMR5WVE5`, envia `analytics_storage: denied` e remove somente cookies de Analytics, preservando autenticação e preferências essenciais. A decisão se propaga para outras abas do mesmo domínio. Uma carga atrasada do script não pode reativar a medição; novo aceite reabilita a propriedade sem duplicar sua configuração.

`npm run test:security:privacy` verifica retirada/reconcessão do consentimento, cookies essenciais e corrida com carregamento atrasado. Para as regras, iniciar o emulador oficial Firebase com Java compatível e executar:

```sh
firebase emulators:exec --only firestore --project demo-rota-biker-security --config firebase.json "npm run test:security:rules"
```

O teste usa contas simuladas Alice/Bob e visitante sem login. Verifica isolamento em ambos os sentidos, criação, alteração e exclusão, proibição de listagens, campos extras, IDs desconhecidos, valores inválidos e operações reais de marcar/desmarcar. O script se recusa a executar sem o endereço local do emulador e usa exclusivamente o projeto `demo-rota-biker-security`. Isso não substitui a publicação das mesmas regras no projeto real nem um teste de login Google com duas contas reais.

As dependências transitivas `@grpc/grpc-js`, `postcss-selector-parser` e `argparse` têm versões corrigidas fixadas em `overrides`. O argparse 2 mantém a compatibilidade legada usada pelo CLI do js-yaml 3 e remove a dependência do sprintf-js vulnerável. Ao atualizar os pacotes-pai, reavaliar a necessidade desses overrides.

Na validação de 20/10/2026, o teste de privacidade e os oito cenários do emulador passaram, assim como a compilação de produção e o CLI legado do js-yaml. O audit de dependências de produção ficou sem alertas. O audit completo ainda aponta GHSA-vfj7-8cjw-p6xm em `braces` (propagado por cinco pacotes de desenvolvimento do ESLint/Next): não há versão corrigida publicada; os padrões usados pelo lint vêm do repositório, não de entrada de visitantes. Esse alerta não foi ocultado nem foi feito downgrade do Next para suprimi-lo. Reavaliar quando houver correção upstream.

Em 20/10/2026, o proprietário confirmou a publicação de `firestore.rules` no console do projeto `estrada-a-dois-rota-biker` e o teste de marcar/desmarcar com persistência após recarregar. O isolamento entre contas passou no emulador; o teste com duas contas Google reais ainda não foi confirmado. Os testes locais não alteraram contas ou históricos reais.

Para o lançamento, `/rota-biker` também está no menu principal (desktop e celular) e no sitemap público do site. O menu usa a versão recolhida até 1023 px para acomodar todos os links.

## Correção da permissão de localização

O cabeçalho global `Permissions-Policy: geolocation=()` bloqueava a API antes de solicitar permissão. A configuração agora mantém o bloqueio global e aplica uma exceção apenas a `/rota-biker`: `camera=(), microphone=(), geolocation=(self)`. A autorização do navegador e do sistema operacional continua obrigatória. O bloco “Como testar minha localização” foi removido a pedido do usuário.


## Testes de múltiplas paradas

`node --experimental-strip-types --test tests/biker-route.test.mjs` verifica 10 locais, retorno à origem, sequência e limites das etapas móveis, compatibilidade de um destino, codificação de endereços e rejeição de excesso/coordenadas inválidas. Verificar na prévia: adicionar pelos detalhes e seletor; impedir duplicação; reordenar/remover; limite de 9 monumentos (8 com volta); GPS recusado e alternativa por endereço; marcas de visita independentes; abrir rota completa e etapas em dispositivos reais. Esta alteração é somente para teste, sem merge na main nem publicação em produção.
