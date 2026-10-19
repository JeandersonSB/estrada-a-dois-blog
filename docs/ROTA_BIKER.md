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

Aplicar as regras abaixo ANTES de habilitar o aplicativo. A chave web pública Firebase não substitui as regras de acesso. Não colocar credenciais administrativas no navegador.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bikerVisits/{uid} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['visits'])
        && request.resource.data.visits is map
        && request.resource.data.visits.size() <= 1000;
    }
  }
}
```

Sem configuração, marcações funcionam apenas no navegador. Ao entrar, o histórico da conta substitui o histórico local; não há importação automática. A sessão não escreve visitas de outra conta. Não existe coleta de localização até o usuário clicar em Minha localização ou abrir Planejar viagem. Cartão PNG 1080x1920 gerado localmente; gráfico de pontos esquemático, sem mapa-base.

## Planejamento e busca

Origem obrigatória por geolocalização do navegador (sem campo editável), com posição sem cache, alta precisão e timeout de 15 segundos. A pessoa escolhe um monumento em um select ordenado por distância crescente. A distância é Haversine (linha reta), explicitamente identificada na tela, sem representar distância rodoviária. Google Maps recebe origem e destino; Waze recebe o destino e usa a posição atual do próprio aplicativo. Não há múltiplas paradas nesta versão. Não grava a geolocalização em banco, analytics ou cartão.

Cidades, UF, nomes dos estados e números enriquecidos a partir da lista oficial https://monumentobikers.com.br/ em 19/10/2026; coordenadas preservadas do mapa original. IDs não mudaram, preservando marcações anteriores. Busca por nome, apelidos, cidade, estado, sigla, região, país e número, sem exigir acentos. Siglas e números usam palavras inteiras para evitar, por exemplo, PR corresponder a Prado ou número 1 corresponder a 12. Cajá é exibida como localidade conforme a lista oficial.

Marcadores existentes são recoloridos sem reconstruir a camada. Marcar uma visita no filtro de pendentes troca para Todos; desmarcar em Visitados também troca para Todos, mantendo o ponto visível.

## Validação manual após configurar

Entrar com Google em duas contas, marcar/desmarcar e recarregar; confirmar isolamento de dados e negação de leitura de outro UID pelas regras. Conferir sincronização em outro navegador. Conferir negação offline, popup bloqueado, localização recusada e mapa indisponível. Permitir localização no celular e verificar a ordenação crescente do select; selecionar um monumento e conferir Google Maps e Waze. Testar erro de permissão, timeout e nova tentativa. Marcar um ponto no filtro de pendentes e confirmar que permanece visível e verde. Baixar PNG e confirmar contador. Nenhum segredo ou projeto Firebase foi provisionado por este PR.
