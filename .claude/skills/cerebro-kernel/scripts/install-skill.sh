#!/usr/bin/env bash
# install-skill.sh — instala a skill cerebro-kernel via Bitbucket Packages
# sem tocar no package.json/package-lock/node_modules do projeto alvo.
#
# Uso:
#   install-skill.sh [diretorio-alvo] [versao]
#
#   diretorio-alvo  padrão: diretório atual
#   versao          padrão: latest (ex.: 1.0.0)
#
# Requer .npmrc (local ou global) com:
#   @atlti:registry=https://npm.apkg.io/atlti/
#   //npm.apkg.io/atlti/:username=<email>
#   //npm.apkg.io/atlti/:_password=<token-base64>
set -uo pipefail

PKG="@atlti/cerebro-kernel"
TARGET="${1:-.}"
VERSION="${2:-latest}"

die() { echo "install-skill: $*" >&2; exit 1; }

command -v npm >/dev/null 2>&1 || die "npm não encontrado no PATH."
[ -d "$TARGET" ] || die "diretório alvo não existe: $TARGET"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "install-skill: instalando ${PKG}@${VERSION} em diretório isolado (nada é gravado no projeto alvo)..."
npm install --no-save --no-audit --no-fund --prefix "$TMP" "${PKG}@${VERSION}" \
  || die "falha ao instalar ${PKG}@${VERSION} — confira o .npmrc (registry/credenciais)."

SRC="$TMP/node_modules/$PKG"
[ -d "$SRC" ] || die "pacote instalado mas não encontrado em $SRC."

DEST="$TARGET/.claude/skills/cerebro-kernel"
mkdir -p "$DEST"
cp -r "$SRC/." "$DEST/"
rm -f "$DEST/package.json"

echo "install-skill: ok — skill instalada em $DEST"
echo "install-skill: $TARGET/package.json e node_modules não foram tocados."
