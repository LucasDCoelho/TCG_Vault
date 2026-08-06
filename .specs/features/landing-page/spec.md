# Feature: Landing page pública (SEO) — RabbitLab TCG Vault

## Contexto

MVP no ar em `https://tcg-vault-lyart.vercel.app`, mas a URL pública serve o SPA
Angular (JS-rendered) que indexa mal no Google. Queremos uma **landing page
estática** que rankeie no Google e envie visitantes ao app.

## Problema real

1. **Indexação:** o Google quase não indexa conteúdo renderizado por JS.
2. **Conversão:** quem acha o TCG Vault precisa de um call-to-action claro.
3. **Risco:** mudar a raiz do domínio não pode quebrar o app que já está no ar.

## Decisão de arquitetura

- Landing **estática** (HTML puro, sem JS obrigatório) servida na **raiz** do
  domínio atual (`/`).
- App Angular movido para **`/app`** (`baseHref="/app/"`), mantendo todas as
  rotas (`/app/vault`, `/app/login`, `/app/auth/callback`, `/app/scan`,
  `/app/cards/:id`).
- **Um único domínio** = autoridade de SEO concentrada na marca.
- Build do Vercel: bundle do Angular vai para subpasta `app/`; landing + SEO
  files (robots, sitemap) vão para a raiz do output.
- Fallback SPA via `vercel.json` rewrite: `/app/:path*` → `/app/index.html`
  (arquivos estáticos têm precedência, então assets servem normal).

## Requisitos

| ID | Requisito | Prioridade | Notas |
|----|-----------|------------|-------|
| R01 | Landing estática sem JS obrigatório | Must | HTML + CSS inline; funciona sem JS |
| R02 | SEO: `title`, `meta description`, canonical, Open Graph, JSON-LD | Must | Produto/Organização no schema |
| R03 | CTA principal "Acessar o Cofre" → `/app/` | Must | Visível acima da dobra |
| R04 | Identidade visual RabbitLab (laranja/branco, tokens, sem emoji) | Must | DESIGN.md + styles.scss |
| R05 | App sob `/app` com `baseHref` | Must | Rotas relativas continuam funcionando |
| R06 | Fallback SPA `/app/:path*` no Vercel | Must | Deep links do app não dão 404 |
| R07 | Redirect pós-OAuth para `/app/auth/callback` | Must | Mudança no `auth.py` (back) |
| R08 | `robots.txt` + `sitemap.xml` | Should | Indexar landing; app fora do index |
| R09 | Build script reprodutível (`build:deploy`) | Must | Move bundle p/ `app/` + copia landing |
| R10 | Validação: build ok, testes ok, estrutura do output conferida | Must | Verificar `dist/front/browser` |

## Fora do escopo

- Prerender/SSR do Angular
- Landing em outro domínio/subdomínio
- Página própria de SEO por carta (backlog)
- Analytics (deixar pronto para adicionar depois)

## Critérios de aceite

- [ ] R01: abrindo `/` com JS desabilitado, a landing renderiza e o link funciona.
- [ ] R02/R03/R04: tags SEO presentes, OG válido, CTA → `/app/`, tokens da marca.
- [ ] R05: `ng build` gera bundle com base `/app/`; rotas resolvem sob `/app`.
- [ ] R06: `vercel.json` com rewrite de fallback para `/app/*`.
- [ ] R07: back redireciona para `${frontend_url}/app/auth/callback` (dev e prod).
- [ ] R09: `npm run build:deploy` reproduz `dist/front/browser` com `index.html`
      (landing) + `app/index.html` (SPA) + assets.
- [ ] R10: `npm run build` sem erros; `npm test` (ChromeHeadless) 2/2.

## Riscos identificados

- Mover o app para `/app` muda URLs públicas (login, deep links) → avisar em
  DEPLOY.md e STATE.md; Google Console não muda (redirect do OAuth é path do
  front, o `GOOGLE_REDIRECT_URI` continua no back).
- Vercel: rewrite de fallback não pode engolir assets → static files têm
  precedência no Vercel; validar a estrutura após build.
- `favicon.ico` do app precisa estar junto do bundle em `/app/favicon.ico`.
