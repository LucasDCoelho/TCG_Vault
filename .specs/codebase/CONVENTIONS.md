# CONVENTIONS

## Nomenclatura
- **Back:** módulos em snake_case (`ocr.py`, `scryfall.py`); classes em PascalCase
  (`ScryfallClient`); rotas prefixadas por recurso (`/auth`, `/scan`, `/cards`).
- **Front:** arquivos kebab-case, componente com mesmo nome do diretório
  (`pages/vault/vault.ts`); classes em PascalCase; signals `xxxSig` + readonly
  exposto (`token`, `user`).
- **Commit/semântica:** seguir o padrão do repositório quando git for iniciado.

## Padrões a manter
- Componentes standalone com `imports` explícitos (sem NgModule).
- Sem emoji como ícone — SVG inline (Lucide-style, stroke 2px).
- Cores SEMPRE via token CSS (`var(--color-*)` de `styles.scss`), nunca hex cru
  em componente.
- Body ≥16px, alvos de toque ≥44px, contrastes AA (ver DESIGN.md).
- Back: dependências importadas sob demanda quando são opcionais (OCR).
- Front: `track by` em loops (`@for` com `track`), lazy load de imagens.

## Estrutura de pastas
- Front: feature = página em `pages/<nome>/`; compartilhado em `components/`,
  `services/`, `models/`.
- Back: lógica de negócio em módulos `app/*.py`; HTTP em `routers/`.
