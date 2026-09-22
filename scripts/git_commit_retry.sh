#!/usr/bin/env bash
set -euo pipefail

message="${1:?commit message required}"
shift

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git add -- "$@"

allow_empty="${ALLOW_EMPTY_COMMIT:-false}"

if git diff --cached --quiet; then
  if [ "$allow_empty" = "true" ]; then
    echo "Nenhuma alteração de arquivo; criando commit vazio de finalização."
    git commit --allow-empty -m "$message"
  else
    echo "Nenhuma alteração para publicar."
    exit 0
  fi
else
  git commit -m "$message"
fi

for attempt in 1 2 3 4 5; do
  echo "Tentativa ${attempt}/5 de sincronizar e publicar..."
  git fetch origin main

  if ! git rebase origin/main; then
    git rebase --abort || true
    echo "Conflito durante rebase; nova tentativa após atualizar a referência."
    sleep $((attempt * 2))
    continue
  fi

  if git push origin HEAD:main; then
    echo "Publicação concluída."
    exit 0
  fi

  sleep $((attempt * 2))
done

echo "Falha ao publicar após 5 tentativas."
exit 1
