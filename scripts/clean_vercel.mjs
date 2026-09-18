// scripts/clean_vercel.mjs
// Robô de Faxina Automático: limpa deploys antigos na Vercel para economizar armazenamento

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_NAME = process.env.VERCEL_PROJECT_NAME || 'estrada-a-dois-blog';
const KEEP_COUNT = parseInt(process.env.KEEP_COUNT || '5', 10);

if (!VERCEL_TOKEN) {
  console.error('❌ ERRO: VERCEL_TOKEN não configurado no ambiente.');
  console.error('👉 Adicione o segredo VERCEL_TOKEN no GitHub (Settings > Secrets and variables > Actions).');
  process.exit(1);
}

async function cleanOldDeployments() {
  console.log(`🧹 Iniciando faxina na Vercel para o projeto: "${PROJECT_NAME}"...`);
  console.log(`🛡️ Mantendo os ${KEEP_COUNT} deploys mais recentes intactos por segurança.\n`);

  try {
    // 1. Listar deployments da Vercel
    const url = `https://api.vercel.com/v6/deployments?app=${encodeURIComponent(PROJECT_NAME)}&limit=100`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Falha ao listar deployments da Vercel (Status ${res.status}): ${errText}`);
    }

    const data = await res.json();
    const deployments = data.deployments || [];

    console.log(`📦 Total de deploys encontrados para "${PROJECT_NAME}": ${deployments.length}`);

    if (deployments.length <= KEEP_COUNT) {
      console.log(`✅ Quantidade atual de deploys (${deployments.length}) já está dentro do limite seguro (<= ${KEEP_COUNT}). Nada a excluir.`);
      return;
    }

    // Ordenar por data decrescente (mais recente primeiro)
    deployments.sort((a, b) => (b.created || 0) - (a.created || 0));

    // Os primeiros KEEP_COUNT são mantidos
    const toKeep = deployments.slice(0, KEEP_COUNT);
    const toDelete = deployments.slice(KEEP_COUNT);

    console.log(`🛡️ Deploys protegidos (mais recentes):`);
    toKeep.forEach((d, idx) => {
      console.log(`  ${idx + 1}. [${d.uid}] ${d.url} (${new Date(d.created).toLocaleString('pt-BR')})`);
    });

    console.log(`\n🗑️ Deploys antigos a serem excluídos: ${toDelete.length}`);

    let deletedCount = 0;
    let errorCount = 0;

    for (const dep of toDelete) {
      const deleteUrl = `https://api.vercel.com/v13/deployments/${dep.uid}`;
      try {
        const delRes = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
          },
        });

        if (delRes.ok) {
          deletedCount++;
          console.log(`  ✅ Excluído: [${dep.uid}] ${dep.url} (${new Date(dep.created).toLocaleDateString('pt-BR')})`);
        } else {
          errorCount++;
          const errBody = await delRes.text();
          console.warn(`  ⚠️ Falha ao excluir [${dep.uid}]: Status ${delRes.status} - ${errBody}`);
        }
      } catch (err) {
        errorCount++;
        console.error(`  ❌ Erro de conexão ao excluir [${dep.uid}]: ${err.message}`);
      }

      // Pequena pausa de 300ms entre as requisições para evitar rate limit
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log(`\n🎉 Faxina concluída!`);
    console.log(`- Excluídos com sucesso: ${deletedCount}`);
    if (errorCount > 0) {
      console.log(`- Falhas/Avisos: ${errorCount}`);
    }
  } catch (err) {
    console.error(`💥 Erro durante a faxina:`, err.message);
    process.exit(1);
  }
}

cleanOldDeployments();
