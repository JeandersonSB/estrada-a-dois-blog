import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { APPROVED, notifyTelegram, validateWeek } from './editorial/common.mjs';

const before = process.env.BEFORE_SHA;
const head = process.env.HEAD_SHA;
if (!/^[a-f0-9]{40}$/.test(before || '') || !/^[a-f0-9]{40}$/.test(head || '')) throw new Error('Revisões Git inválidas para identificar o lote salvo.');
const changed = execFileSync('git', ['diff', '--name-only', before, head, '--', 'content/editorial/reports'], { encoding: 'utf8' }).trim().split('\n');
for (const file of changed) {
  const match = file.match(/^content\/editorial\/reports\/(\d{4}-\d{2}-\d{2})\.json$/);
  if (!match || !fs.existsSync(file)) continue;
  const week = validateWeek(match[1]);
  const report = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(report.articles) || !Array.isArray(report.errors)) throw new Error('Relatório editorial inválido.');
  if (report.articles.every(item => item.reused) && !report.errors.length) continue;
  const lines = report.articles.map(item => `${item.category}: ${item.title}\nSugestão: ${item.planned_for.slice(0, 10)} às 10h47`);
  await notifyTelegram(`📝 Estrada a Dois — semana de ${week}\n\n${lines.join('\n\n')}\n\n${report.errors.length ? `⚠️ ${report.errors.length} categoria(s) com falha de preparação.\n\n` : ''}${report.articles.length ? `Revise os rascunhos, fontes e capas no painel. Marque as duas confirmações e escolha “${APPROVED}”.` : 'Não foram criados rascunhos nesta execução.'}\nhttps://www.estradaadois.com/admin/`);
}
