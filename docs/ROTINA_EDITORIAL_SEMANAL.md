# Rotina semanal de rascunhos — Estrada a Dois

Correção de escopo em 24/10/2026: o usuário não autorizou alterar o painel CMS. A configuração original de public/admin/config.yml foi restaurada. A automação entrega somente rascunhos; revisão e publicação são manuais, pelo fluxo existente.

Não alterar campos, filtros, layout, versão ou funcionamento do CMS para acomodar a rotina. Não adicionar etapas de aprovação nem agendamento automático de publicação. O workflow de publicação agendada criado durante a implantação foi removido. Não reativá-lo sem solicitação explícita do usuário.

## Preparação e calendário sugerido

A tarefa **Artigos semanais Estrada a Dois** do ChatGPT começa aos domingos, às 09h17 de Brasília, e prepara três artigos. A distribuição sugerida é segunda para Dicas, quarta para Equipamentos e sexta para Manutenção. Datas sugeridas no relatório não são agendamentos de publicação.

Os arquivos são salvos em content/posts com status **⏳ Rascunho**. O workflow notify_editorial.yml envia aviso no Telegram depois do commit do relatório na main. O usuário abre o /admin, revisa e publica como já fazia, usando os estados originais **⏳ Rascunho** e **🟢 Publicado**.

A rotina mantém pesquisa, pautas, capas e prevenção de duplicação. O teste da API Gemini em 24/10/2026 retornou HTTP 429 em todos os modelos. A geração ativa usa a tarefa do ChatGPT; Gemini é apenas uma alternativa manual, dependendo da cota.

## Pesquisa e redação

- Seguir docs/MANUAL_EDITORIAL_SEO_ADSENSE.md. Exemplos do manual não são evidência de especificações universais.
- Conferir pelo menos duas páginas oficiais específicas por artigo, com trechos curtos literais presentes no HTML. Isso comprova a consulta, sem substituir revisão humana da interpretação e da aplicação ao modelo.
- Não inventar experiências do casal, testes, preços, certificações ou parâmetros mecânicos. Manutenção separa inspeção simples de serviço em oficina.
- Dicas: 700–1.200 palavras, checklist e erro comum. Equipamentos: 800–1.400, tabela e veredito por perfil. Manutenção: 700–1.300, linguagem responsável e indicação de oficina quando necessário.
- Título: 45–65 caracteres. Resumo: 140–160. Corpo sem H1, com H2/H3 e parágrafos curtos.
- Inserir “💡 **Leia também nossos outros roteiros autorais:**” em pelo menos duas seções pertinentes, com roteiros publicados. Fontes no final. O template já inclui os botões das redes.
- Capas são ilustrações conceituais próprias em WebP, sem alegar registro real ou teste de produto.

## Planejamento e preservação

content/editorial/plan.json contém as 12 pautas de 26/10 a 20/11/2026. Quando faltar uma semana, a tarefa amplia o plano em ciclos de quatro semanas, confrontando intenção de busca com o acervo e as pautas reservadas.

Cada categoria/semana tem editorial_id. Reexecuções completam apenas categorias ausentes e preservam integralmente conteúdo, status e edições do usuário. O relatório registra títulos, fontes, evidências, contagem de palavras e datas sugeridas. Nunca sobrescrever conteúdo revisado para cumprir frequência.

## Entrada e salvamento da tarefa

Preparar JSON temporário com week (segunda-feira em YYYY-MM-DD) e articles. Cada artigo contém category, article (title, excerpt, body), sources (title, url e claims com fact e quote literal de 35–180 caracteres), e review_notes. Incluir pelo menos duas fontes por artigo; usar os domínios oficiais permitidos em scripts/editorial/gemini.mjs.

Executar npm ci e node scripts/import_editorial.mjs /tmp/semana-editorial.json. O importador confere fontes, formato, links e extensão, cria capas e salva em Rascunho. Corrigir os erros de conteúdo ou fontes sem afrouxar os validadores. Não chamar scripts de publicação.

Salvar em um único commit na main os novos Markdown, suas capas, o relatório e eventual plano atualizado, com [skip vercel]. Preservar o head mais recente e usar lease em update_ref; não forçar nem sobrescrever mudanças concorrentes. Para capas binárias, usar blobs base64 pelo conector GitHub.

Ler de volta os arquivos e conferir a execução do aviso. A tarefa não precisa de tokens do Telegram e não deve enviar mensagens diretamente. Esses Secrets continuam somente no workflow de aviso.

Validação: node --test tests/editorial.test.mjs. Prévia do calendário: node scripts/expert_bot.mjs plan.

A limpeza de deploys da Vercel não muda. A avaliação após oito semanas é uma revisão dos resultados editoriais; não há leitura automática do Search Console.
