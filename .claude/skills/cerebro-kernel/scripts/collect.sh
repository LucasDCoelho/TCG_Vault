#!/usr/bin/env bash
# collect.sh — coleta o diff e os metadados para a auditoria safe-guard.
#
# Uso:
#   collect.sh agora              # alterações não commitadas (working tree + staged + novos)
#   collect.sh commits [N]        # últimos N commits (padrão 10)
#   collect.sh commits main..HEAD # ou um range/branch explícito no lugar de N
#
# Lê SEMPRE o estado real do repo. Trata: repositório com menos de N commits,
# nomes de arquivo com espaço, arquivos binários/gigantes, merges e ruído gerado.
set -uo pipefail

MODE="${1:-}"
N="${2:-10}"

# Ruído gerado/binário que polui a auditoria. ':(glob,exclude)' filtra raiz E subpastas.
EXCLUDES=(
  ':(glob,exclude)**/package-lock.json'
  ':(glob,exclude)**/yarn.lock'
  ':(glob,exclude)**/pnpm-lock.yaml'
  ':(glob,exclude)**/poetry.lock'
  ':(glob,exclude)**/Gemfile.lock'
  ':(glob,exclude)**/composer.lock'
  ':(glob,exclude)**/*.min.js'
  ':(glob,exclude)**/*.min.css'
  ':(glob,exclude)**/*.map'
  ':(glob,exclude)**/dist/**'
  ':(glob,exclude)**/build/**'
  ':(glob,exclude)**/node_modules/**'
  ':(glob,exclude)**/__snapshots__/**'
)

die() { echo "safe-guard: $*" >&2; exit 1; }

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || die "não é um repositório git."

# Imprime um arquivo novo — só se for texto e não for grande demais.
dump_file() {
  local f="$1"
  [ -f "$f" ] || return
  if [ ! -s "$f" ]; then echo "=== NOVO (vazio): $f ==="; return; fi
  if ! grep -Iq . "$f" 2>/dev/null; then
    echo "=== NOVO (binário, conteúdo omitido): $f ==="; return
  fi
  local lines; lines=$(wc -l < "$f" 2>/dev/null || echo 0)
  if [ "$lines" -gt 800 ]; then
    echo "=== NOVO (grande, ${lines} linhas — exibindo as 200 primeiras): $f ==="
    head -n 200 "$f"
  else
    echo "=== NOVO: $f ==="; cat "$f"
  fi
}

case "$MODE" in
  agora)
    echo "##### STATUS #####"
    git status -s

    echo; echo "##### AUTOR ATUAL #####"
    git config user.name || echo "(user.name não configurado — marcar como 'não commitado')"

    echo; echo "##### DIFF — WORKING TREE (não staged) #####"
    git diff -- . "${EXCLUDES[@]}"

    echo; echo "##### DIFF — STAGED (entra no próximo commit) #####"
    git diff --cached -- . "${EXCLUDES[@]}"

    echo; echo "##### ARQUIVOS NOVOS (não rastreados) #####"
    while IFS= read -r -d '' f; do dump_file "$f"; done \
      < <(git ls-files --others --exclude-standard -z)
    ;;

  commits)
    total=$(git rev-list --count HEAD 2>/dev/null || echo 0)
    [ "$total" -eq 0 ] && die "o repositório ainda não tem commits."

    if [[ "$N" == *".."* ]]; then
      # Range/branch explícito (ex.: main..HEAD)
      LOG_SEL=("$N"); DIFF_RANGE=("$N")
      hashes=$(git log "$N" --no-merges --pretty=format:'%h')
      echo "##### COMMITS NO ESCOPO (range: $N) #####"
    else
      [ "$N" -gt "$total" ] 2>/dev/null && N="$total"
      LOG_SEL=(-n "$N")
      hashes=$(git log -n "$N" --no-merges --pretty=format:'%h')
      if [ "$N" -ge "$total" ]; then
        DIFF_RANGE=("$(git hash-object -t tree /dev/null)" "HEAD")  # história completa, c/ raiz
      else
        DIFF_RANGE=("HEAD~$N..HEAD")
      fi
      echo "##### COMMITS NO ESCOPO (N=$N de $total) #####"
    fi
    git log "${LOG_SEL[@]}" --no-merges --pretty=format:'%h | %an | %ad | %s' --date=short
    echo

    echo; echo "##### ARQUIVOS POR COMMIT (commit -> autor -> arquivos) #####"
    while IFS= read -r h; do
      [ -z "$h" ] && continue
      echo "=== $(git show -s --format='%h | %an | %s' "$h") ==="
      git show --stat --pretty=format:'' "$h" -- . "${EXCLUDES[@]}"
      echo
    done <<< "$hashes"

    echo; echo "##### DIFF COMPLETO DO ESCOPO #####"
    git diff "${DIFF_RANGE[@]}" -- . "${EXCLUDES[@]}"
    ;;

  *)
    die "modo inválido. Use: collect.sh agora  |  collect.sh commits [N|range]"
    ;;
esac
