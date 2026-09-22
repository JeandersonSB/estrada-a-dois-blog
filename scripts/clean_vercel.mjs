// scripts/clean_vercel.mjs
// Mantém poucos deployments úteis e remove previews/erros antigos sem arriscar a produção atual.

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_VAkuyXkjskhBGAEkT7R5LyglgJAp';
const TEAM_ID = process.env.VERCEL_TEAM_ID || 'team_aJBVPVcwGqAPDRsLQYhOBYRf';
const KEEP_PREVIEW = parseInt(process.env.KEEP_PREVIEW || '2', 10);
const MAX_DEPLOYMENTS = parseInt(process.env.MAX_DEPLOYMENTS || '500', 10);

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN não configurado.');
  process.exit(1);
}

async function fetchDeployments() {
  const deployments = [];
  let until = null;

  while (deployments.length < MAX_DEPLOYMENTS) {
    const params = new URLSearchParams({
      projectId: PROJECT_ID,
      teamId: TEAM_ID,
      limit: '100',
    });

    if (until) params.set('until', String(until));

    const res = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });

    if (!res.ok) {
      throw new Error(`Falha ao listar deployments (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    const page = data.deployments || [];
    deployments.push(...page);

    if (!data.pagination?.next || page.length === 0) break;
    until = Number(data.pagination.next) - 1;
  }

  return deployments.slice(0, MAX_DEPLOYMENTS);
}

function newestFirst(a, b) {
  return (b.created || b.createdAt || 0) - (a.created || a.createdAt || 0);
}

async function deleteDeployment(dep) {
  const id = dep.uid || dep.id;
  const params = new URLSearchParams({ teamId: TEAM_ID });

  const res = await fetch(
    `https://api.vercel.com/v13/deployments/${id}?${params.toString()}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    }
  );

  if (!res.ok) {
    throw new Error(`${res.status} - ${await res.text()}`);
  }
}

async function run() {
  console.log('🧹 Faxina Vercel iniciada.');
  console.log(`Projeto: ${PROJECT_ID}`);
  console.log(`Retenção: produção preservada integralmente + ${KEEP_PREVIEW} previews READY`);

  const deployments = (await fetchDeployments()).sort(newestFirst);

  const inProgress = deployments.filter((d) =>
    ['BUILDING', 'QUEUED', 'INITIALIZING'].includes(d.state)
  );

  const production = deployments.filter(
    (d) => d.target === 'production' && !inProgress.includes(d)
  );

  const previewReady = deployments.filter(
    (d) => d.target !== 'production' && d.state === 'READY'
  );

  const disposable = deployments.filter(
    (d) =>
      !inProgress.includes(d) &&
      !production.includes(d) &&
      !previewReady.includes(d)
  );

  const keepPreview = new Set(
    previewReady.slice(0, KEEP_PREVIEW).map((d) => d.uid || d.id)
  );

  // Produção NUNCA é removida automaticamente.
  // Isso protege rollbacks, aliases ativos e versões históricas úteis.
  const toDelete = [
    ...previewReady.filter((d) => !keepPreview.has(d.uid || d.id)),
    ...disposable,
  ];

  console.log(`📦 Encontrados: ${deployments.length}`);
  console.log(`🛡️ Em andamento preservados: ${inProgress.length}`);
  console.log(`🛡️ Produção preservada integralmente: ${production.length}`);
  console.log(`🛡️ Preview READY preservado: ${Math.min(previewReady.length, KEEP_PREVIEW)}`);
  console.log(`🗑️ A excluir: ${toDelete.length}`);

  let deleted = 0;
  let failed = 0;

  for (const dep of toDelete) {
    const id = dep.uid || dep.id;
    try {
      await deleteDeployment(dep);
      deleted++;
      console.log(`✅ Excluído: ${id} | ${dep.target || 'preview'} | ${dep.state}`);
    } catch (error) {
      failed++;
      console.warn(`⚠️ Não foi possível excluir ${id}: ${error.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log(`🎉 Faxina concluída: ${deleted} excluídos, ${failed} falhas.`);
}

run().catch((error) => {
  console.error('💥 Erro na faxina:', error.message);
  process.exit(1);
});
