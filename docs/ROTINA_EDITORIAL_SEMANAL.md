# Rotina editorial semanal — Estrada a Dois

Implementada em 24/10/2026. Substitui o gerador removido em 12/10; não reativa Notícias.

## Calendário e aprovação

| Etapa | Quando, em Brasília | Resultado |
| --- | --- | --- |
| Preparar lote | Domingo, 09h17 | Três rascunhos no painel e aviso no Telegram |
| Dicas | Segunda, a partir das 10h47 | Publicação somente após revisão humana |
| Equipamentos | Quarta, a partir das 10h47 | Publicação somente após revisão humana |
| Manutenção | Sexta, a partir das 10h47 | Publicação somente após revisão humana |

O GitHub Actions pode atrasar tarefas agendadas. Uma aprovação atrasada é recuperada na próxima janela de publicação; nenhum artigo é publicado para cumprir frequência sem aprovação. A execução de publicação pode também ser acionada manualmente no GitHub, respeitando a data planejada.

No `/admin`, abra o rascunho, confira texto, links/fontes, imagem e crédito. Acrescente vivências reais quando tiver, sem exigir relato pessoal para toda pauta técnica. Marque **Texto e fontes revisados por mim** e **Capa e crédito conferidos por mim**, confira a **Publicação planejada (Brasília)** e selecione **✅ Aprovado para agendar**. Salve. Para adiar, altere a data ou volte para **⏳ Rascunho**. A opção **🟢 Publicado** continua sendo publicação manual imediata, fora desse agendamento.

## Pesquisa, conteúdo e capas

- A API Gemini pesquisa na web e consulta URLs; modelos alternativos são tentados em caso de indisponibilidade. Usa a chave já configurada em `GEMINI_API_KEY`, sem expô-la no cliente ou nos logs.
- Pelo menos duas páginas oficiais devem passar na conferência de evidência: trechos literais presentes no HTML obtido ou PDF cuja leitura tenha sido confirmada pela ferramenta URL Context. Isso comprova a consulta, **não substitui revisão técnica humana** da interpretação, atualidade, aplicação ao modelo e legislação.
- O relatório semanal conserva fontes, evidências curtas, modelos, pendências e contagem de palavras. Não guarda credenciais nem prompts com dados privados.
- Cada categoria respeita o manual; exemplos de especificações do manual não são tratados como fatos universais. Não são inventados testes, experiências do casal, preços ou parâmetros mecânicos.
- Links “Leia também” ficam junto às seções pertinentes, apontando a roteiros autorais já publicados. As redes sociais usam botões verdes com evento `social_cta_click` e categoria/slug.
- Capas são ilustrações vetoriais próprias renderizadas em WebP, representando o assunto; não são fotos de produtos, testes nem desenhos de reparo. Crédito e descrição aparecem no painel e no artigo. O editor pode substituir a capa e deve atualizar os créditos.
- Ao faltar fonte, formato ou limite de palavras, a geração registra falha; não transforma conteúdo incompleto em artigo público.

## Planejamento e recuperação

`content/editorial/plan.json` contém as 12 pautas de 26/10 a 20/11/2026. Ao precisar de uma semana ainda não planejada, o robô cria outro ciclo de quatro semanas, confrontando títulos/intenção com todo o acervo e pautas reservadas. A comparação automática é uma triagem; a revisão humana também deve verificar sobreposição de intenção.

Cada categoria/semana tem identidade própria (`editorial_id`). Reexecuções completam somente o que falta e preservam edições, aprovações e artigos já publicados. Falhas parciais mantêm os rascunhos concluídos e deixam a execução com erro visível. O aviso de novos rascunhos só é enviado depois do commit ser confirmado.

O primeiro lote também é preparado quando esta configuração entra na `main`. Para repetir uma semana, use **Actions → Robô Especialista — Lote Semanal com Revisão → Run workflow**, informando a segunda-feira em `YYYY-MM-DD`.

## Configuração técnica e limites

- Secrets existentes: `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- Opcional: variável `EDITORIAL_MODELS`, lista de modelos Gemini compatíveis com Search/URL Context. Padrão: `gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite`.
- Pesquisa e redação consomem a cota da API Gemini; não há contratação ou ativação de plano pago nesta alteração. Cota/permissão indisponível gera falha e aviso.
- Os workflows precisam de `contents: write` para salvar rascunhos e aprovações na `main`.
- Geração usa `[skip vercel]`; rascunhos são lidos diretamente do GitHub pelo painel. Publicação aprovada cria commit com `[force vercel]`, e o conteúdo só fica online após o deploy concluir.
- A limpeza de deploys da Vercel não é alterada por esta implementação.
- Após oito semanas, avaliar no Search Console os artigos/categorias com impressões, cliques e intenção atendida antes de aumentar a frequência. Não há integração de leitura do Search Console nesta rotina.

Validação local: `node --test tests/editorial.test.mjs`. Prévia do próximo lote, sem API, envio ou criação de artigos: `node scripts/expert_bot.mjs plan`.

Referências da API: [Grounding com Google Search](https://ai.google.dev/gemini-api/docs/generate-content/google-search) e [URL Context](https://ai.google.dev/gemini-api/docs/generate-content/url-context).
