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

Sem configuração, marcações funcionam apenas no navegador. Ao entrar, o histórico da conta substitui o histórico local; não há importação automática. A sessão não escreve visitas de outra conta. Não existe coleta de localização até o usuário clicar em Minha localização. Cartão PNG 1080x1920 gerado localmente; gráfico de pontos esquemático, sem mapa-base.

## Planejamento

Origem e destino livres, até três monumentos selecionados na ordem desejada. Link oficial de direções do Google Maps, que calcula o percurso. Não calcula distância nem sugere automaticamente monumentos ao longo de uma rota rodoviária nesta versão. Essa etapa precisa de serviço de rotas e geocodificação antes de ser oferecida. Filtros disponíveis: nome e situação; a fonte não fornece estado/país estruturados.

## Validação manual após configurar

Entrar com Google em duas contas, marcar/desmarcar e recarregar; confirmar isolamento de dados e negação de leitura de outro UID pelas regras. Conferir sincronização em outro navegador. Conferir negação offline, popup bloqueado, localização recusada e mapa indisponível. Montar roteiro no celular e verificar ordem das três paradas. Baixar PNG e confirmar contador. Nenhum segredo ou projeto Firebase foi provisionado por este PR.
