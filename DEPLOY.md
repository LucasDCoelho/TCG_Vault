# Deploy (MVP)

Arquitetura: **front estático no Vercel** + **API FastAPI no Render** + **Postgres/SQLite no Render**.

```
Vercel (Angular) -- HTTPS direto (cross-origin, cookie) --> Render (FastAPI) --> Postgres / SQLite
```

O front fala **direto** com o back (cross-origin, com credenciais). Não há proxy: o cookie de
sessão (HttpOnly, `SameSite=None; Secure`) pertence ao domínio do back, então não atravessaria
um proxy no domínio do front. CORS é resolvido pelo back (origens exatas) e CSRF é mitigado por
checagem de `Origin` em requisições mutáveis.

## 1. Back no Render

1. Crie um repo Git e envie o projeto para o GitHub.
2. No Render: **New → Blueprint**, conecte o repo e selecione o `render.yaml` da raiz.
   - Ele cria o web service `tcg-vault-api` + o Postgres `tcg-vault-db`.
3. No serviço `tcg-vault-api`, preencha as variáveis marcadas `sync: false`:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — do seu projeto Google Cloud (mesmos usados no dev).
   - `GOOGLE_REDIRECT_URI` — `https://SEU-BACK/auth/callback` (SEU-BACK = URL do serviço no Render).
   - `FRONTEND_URL` — `https://SEU-FRONT` (domínio do Vercel, passo 2). **Obrigatório**: é o valor
     usado no CORS e na checagem de `Origin` anti-CSRF.
   - `GOOGLE_API_KEY` — chave do Google Cloud Vision.
   - `JWT_SECRET` e `DATABASE_URL` são preenchidos automaticamente. O `postgresql://`
     que o Render entrega é convertido para o dialeto `postgresql+psycopg` em
     `back/app/database.py` (psycopg 3, suportado no Python 3.14).
4. Deploy. Teste `https://SEU-BACK/health` → deve responder `{"status":"ok",...}`.

> Plano free do Render **dorme** após ~15 min ocioso: a primeira requisição demora ~30-50s (cold start).

## 2. Front no Vercel

1. No Vercel: **Add New → Project**, importe o repo (raiz do front).
2. Framework Preset: **Angular** (auto-detecção). Build **`npm run build:deploy`**,
   output **`dist/front/browser`** (definidos em `front/vercel.json`).
   - O script de deploy (`scripts/deploy-build.mjs`) move o bundle do Angular para
     `app/` e copia a landing (raiz) + `robots.txt` + `sitemap.xml`.
   - **Raiz `/`** = landing estática (SEO, indexável). **`/app/*`** = SPA do TCG Vault.
   - `vercel.json` tem o rewrite de fallback SPA: `/app/:path*` → `/app/index.html`
     (arquivos estáticos têm precedência, então os assets servem normal).
3. Em `front/src/environments/environment.prod.ts`, `apiBase` deve ser a URL **direta** do back
   (`https://SEU-BACK`) — hoje `https://tcg-vault-api.onrender.com`. Ajuste se a sua URL divergir.
4. Deploy. A sessão usa cookie HttpOnly enviado pelo navegador em todas as chamadas (credenciais).

> Sem `.env` no front: a base da API fica em `environment.prod.ts`. Não coloque segredos no front.

> **URLs públicas:** o app mudou de `/` para `/app` (ex.: `/app/vault`, `/app/login`,
> `/app/auth/callback`). A landing responde na raiz. Sem mudança no Google Console
> (o `GOOGLE_REDIRECT_URI` continua apontando para o back).

## 3. Google OAuth em produção

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → seu projeto → **OAuth client ID** (web).
2. Em **Authorized redirect URIs**, adicione `https://SEU-BACK/auth/callback`.
3. Garanta que o domínio do front esteja em **Authorized JavaScript origins** (recomendado).
4. O back usa as MESMAS credenciais dev/prod; apenas o `GOOGLE_REDIRECT_URI` muda por ambiente.
5. O `FRONTEND_URL` do Render deve ser **exatamente** o domínio do Vercel (CORS + anti-CSRF).
6. Após o login, o back redireciona para `${FRONTEND_URL}/app/auth/callback` (rota do SPA sob `/app`).

## Caveats aceitos no MVP

| Item | Situação | Plano |
|------|----------|-------|
| SQLite no Render free | disco efêmero: dados somem a cada deploy/redeploy | usar o Postgres do blueprint (`DATABASE_URL`) para dados duráveis |
| Uploads/`uploads/` | efêmeros no Render free | mover para blob store (S3/R2) se virar produto |
| Cold start free tier | ~30-50s na primeira request | plano pago (always-on) quando for a público |
| Scryfall | API pública, sem chave | cache 5 min já implementado; usar bulk data se precisar escalar |
| OCR | Google Vision exige API key no prod | sem a key, use `OCR_PROVIDER=none` (busca manual) |
| Anti-CSRF | checagem de `Origin` (não double-submit) | suficiente no MVP; evoluir se necessário |

## Segurança

- [x] `JWT_SECRET` real (gerado automaticamente no Render; o back avisa no log se estiver no default).
- [x] `.env` fora do git (`.gitignore`), credenciais só no painel do Render.
- [x] JWT em cookie **HttpOnly** (`SameSite=None; Secure`) — JS não acessa o token; anti-CSRF via Origin.
- [ ] Termos de uso / política de privacidade se houver contas de terceiros.
