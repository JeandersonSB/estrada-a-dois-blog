# Rotina editorial semanal — Estrada a Dois

Implementada em 24/10/2026. Substitui o gerador removido em 12/10; não reativa Notícias. A preparação é feita por uma tarefa semanal do ChatGPT e a publicação é executada pelo GitHub Actions após aprovação no painel.

## Calendário e aprovação

| Etapa | Quando, em Brasília | Resultado |
| --- | --- | --- |
| Preparar lote no ChatGPT | Domingo, 09h17 | Três rascunhos no painel e aviso no Telegram após salvar |
| Dicas | Segunda, a partir das 10h47 | Publicação somente após revisão humana |
| Equipamentos | Quarta, a partir das 10h47 | Publicação somente após revisão humana |
| Manutenção | Sexta, a partir das 10h47 | Publicação somente após revisão humana |

O GitHub Actions pode atrasar tarefas agendadas. Uma aprovação atrasada é recuperada na próxima janela de publicação; nenhum artigo é publicado para cumprir frequência sem aprovação. A execução de publicação pode também ser acionada manualmente no GitHub, respeitando a data planejada.

No `/admin`, abra o rascunho, confira texto, links/fontes, imagem e crédito. Acrescente vivências reais quando tiver, sem exigir relato pessoal para toda pauta técnica. Marque **Texto e fontes revisados por mim** e **Capa e crédito conferidos por mim**, confira a **Publicação planejada (Brasília)** e selecione **✅ Aprovado para agendar**. Salve. Para adiar, altere a data ou volte para **⏳ Rascunho**. A opção **🟢 Publicado** continua sendo publicação manual imediata, fora desse agendamento.

## Pesquisa, conteúdo e capas

- A tarefa do ChatGPT pesquisa fontes primárias atuais, redige o lote e o salva no repositório. Não depende da chave/cota da API Gemini. A conexão GitHub da tarefa precisa continuar disponível.
- Pelo menos duas páginas oficiais devem passar na conferência de evidência: trechos curtos literais presentes no HTML obtido. A entrada da tarefa usa `scripts/import_editorial.mjs`; prefira páginas HTML. Isso comprova a consulta, **não substitui revisão técnica humana** da interpretação, atualidade, aplicação ao modelo e legislação. No gerador manual Gemini, PDF também exige leitura confirmada pelo URL Context.
- O relatório semanal conserva fontes, evidências curtas, modelos, pendências e contagem de palavras. Não guarda credenciais nem prompts com dados privados.
- Cada categoria respeita o manual; exemplos de especificações do manual não são tratados como fatos universais. Não são inventados testes, experiências do casal, preços ou parâmetros mecânicos.
- Links “Leia também” ficam junto às seções pertinentes, apontando a roteiros autorais já publicados. As redes sociais usam botões verdes com evento `social_cta_click` e categoria/slug.
- Capas são ilustrações vetoriais próprias renderizadas em WebP, representando o assunto; não são fotos de produtos, testes nem desenhos de reparo. Crédito e descrição aparecem no painel e no artigo. O editor pode substituir a capa e deve atualizar os créditos.
- Ao faltar fonte, formato ou limite de palavras, a geração registra falha; não transforma conteúdo incompleto em artigo público.

## Planejamento e recuperação

`content/editorial/plan.json` contém as 12 pautas de 26/10 a 20/11/2026. Ao precisar de uma semana ainda não planejada, a tarefa do ChatGPT cria outro ciclo de quatro semanas, confrontando títulos/intenção com todo o acervo e pautas reservadas. A comparação automática é uma triagem; a revisão humana também deve verificar sobreposição de intenção.

Cada categoria/semana tem identidade própria (`editorial_id`). Reexecuções completam somente o que falta e preservam edições, aprovações e artigos já publicados. Falhas parciais mantêm os rascunhos concluídos e deixam a execução com erro visível. O aviso de novos rascunhos só é enviado depois do commit ser confirmado.

O primeiro lote foi preparado diretamente durante a implantação. Reexecuções da tarefa completam somente categorias ausentes. Para a entrada local, prepare um JSON com `week` e `articles` (formato abaixo) e execute `node scripts/import_editorial.mjs /tmp/semana-editorial.json`.

O teste real da API Gemini em 24/10/2026 retornou **HTTP 429 em todos os modelos alternativos**. Por isso, o workflow Gemini ficou disponível somente para execução manual; seu agendamento e disparo por push foram retirados para não haver dois geradores automáticos. O erro original fica registrado no Actions e no histórico Git. A preparação semanal ativa é a tarefa **Artigos semanais Estrada a Dois** do ChatGPT.

### Contrato da entrada da tarefa

```json
{
  "week": "2026-10-26",
  "articles": [{
    "category": "Dicas",
    "article": { "title": "Título de 45 a 65 caracteres", "excerpt": "Resumo de 140 a 160 caracteres", "body": "Markdown integral, sem H1" },
    "sources": [{ "title": "Fonte oficial", "url": "https://dominio-oficial/pagina", "claims": [{ "fact": "Fato sustentado", "quote": "Trecho literal curto, de 35 a 180 caracteres, presente no HTML" }] }],
    "review_notes": ["Pendência que o editor deve revisar"]
  }]
}
```

Inclua um item de cada categoria ausente e pelo menos duas fontes por artigo. O importador confere domínios, trechos de evidência, links, extensão e formato, gera capas e força o estado **Rascunho**, com ambas as revisões falsas. Use os domínios oficiais autorizados em `scripts/editorial/gemini.mjs`; não amplie a lista para aceitar fonte inadequada. Não execute a API Gemini como fallback automático.

Depois da validação, salve **em um único commit na main** os Markdown novos, suas capas, o relatório semanal e eventual plano atualizado, com `[skip vercel]`. A tarefa pode usar o conector GitHub para blobs binários e uma árvore/commit com lease do head. Nunca sobrescreva alterações concorrentes; releia o head se mudar. O workflow `notify_editorial.yml` só envia Telegram depois de esse commit existir. A tarefa não precisa acessar tokens ou enviar mensagens diretamente.

## Configuração técnica e limites

- Secrets existentes usados pelo aviso de lote e pela publicação: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. `GEMINI_API_KEY` é usado apenas no gerador manual alternativo.
- Opcional: variável `EDITORIAL_MODELS`, lista de modelos Gemini compatíveis com Search/URL Context. Padrão: `gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite`.
- A geração semanal utiliza a tarefa do ChatGPT, sujeita aos limites e disponibilidade do serviço e da conexão GitHub. Não há contratação ou ativação de plano pago de API nesta alteração. O Gemini manual depende da cota específica da sua API.
- O conector GitHub da tarefa salva rascunhos na `main`. O workflow de publicação usa `contents: write`; o workflow de aviso usa somente leitura do repositório.
- Geração usa `[skip vercel]`; rascunhos são lidos diretamente do GitHub pelo painel. Publicação aprovada cria commit com `[force vercel]`, e o conteúdo só fica online após o deploy concluir.
- A limpeza de deploys da Vercel não é alterada por esta implementação.
- Após oito semanas, avaliar no Search Console os artigos/categorias com impressões, cliques e intenção atendida antes de aumentar a frequência. Não há integração de leitura do Search Console nesta rotina.

Validação local: `node --test tests/editorial.test.mjs`. Prévia do próximo lote, sem API, envio ou criação de artigos: `node scripts/expert_bot.mjs plan`.

Referências da API: [Grounding com Google Search](https://ai.google.dev/gemini-api/docs/generate-content/google-search) e [URL Context](https://ai.google.dev/gemini-api/docs/generate-content/url-context).
