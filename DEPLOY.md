# Deploy (MVP)

Arquitetura: **front estático no Vercel** + **API FastAPI no Render** + **Postgres/SQLite no Render**.

```
Vercel (Angular) -- /api/* (rewrite) --> Render (FastAPI) --> Postgres / SQLite
```

O rewrite do Vercel entrega `/api/auth/login` para `https://API/auth/login` (o prefixo `/api`
é consumido pelo proxy). Como o navegador só conversa com o domínio do front, **não há CORS em
produção**. Em dev o front usa `http://localhost:8000` direto (CORS já configurado).

## 1. Back no Render

1. Crie um repo Git e envie o projeto para o GitHub.
2. No Render: **New → Blueprint**, conecte o repo e selecione `back/render.yaml`.
   - Ele cria o web service `tcg-vault-api` + o Postgres `tcg-vault-db`.
3. No serviço `tcg-vault-api`, preencha as variáveis marcadas `sync: false`:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — do seu projeto Google Cloud (mesmos usados no dev).
   - `GOOGLE_REDIRECT_URI` — `https://SEU-BACK/auth/callback` (SEU-BACK = URL do serviço no Render).
   - `FRONTEND_URL` — `https://SEU-FRONT` (domínio do Vercel, passo 2).
   - `GOOGLE_API_KEY` — chave do Google Cloud Vision.
   - `JWT_SECRET` e `DATABASE_URL` são preenchidos automaticamente.
4. Deploy. Teste `https://SEU-BACK/health` → deve responder `{"status":"ok",...}`.

> Plano free do Render **dorme** após ~15 min ocioso: a primeira requisição demora ~30-50s (cold start).

## 2. Front no Vercel

1. No Vercel: **Add New → Project**, importe o repo (raiz do front).
2. Framework Preset: **Angular** (auto-detecção). Build `npm run build`, output `dist/front/browser`.
3. Edite `front/vercel.json`: troque `https://tcg-vault-api.onrender.com` pela URL real do back
   (é a única coisa para ajustar).
4. Deploy. O `/api/*` passa a ser proxiado para o back — `https://SEU-FRONT/api/health` deve responder ok.

> Sem `.env` no front: a base da API é `/api` no build de produção (environment.prod.ts) e o
> proxy resolve. Não coloque segredos no front.

## 3. Google OAuth em produção

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → seu projeto → **OAuth client ID** (web).
2. Em **Authorized redirect URIs**, adicione `https://SEU-BACK/auth/callback`.
3. Garanta que o domínio do front esteja em **Authorized JavaScript origins** (recomendado).
4. O back usa as MESMAS credenciais dev/prod; apenas o `GOOGLE_REDIRECT_URI` muda por ambiente.

## Caveats aceitos no MVP

| Item | Situação | Plano |
|------|----------|-------|
| SQLite no Render free | disco efêmero: dados somem a cada deploy/redeploy | usar o Postgres do blueprint (`DATABASE_URL`) para dados duráveis |
| Uploads/`uploads/` | efêmeros no Render free | mover para blob store (S3/R2) se virar produto |
| Cold start free tier | ~30-50s na primeira request | plano pago (always-on) quando for a público |
| Scryfall | API pública, sem chave | cache 5 min já implementado; usar bulk data se precisar escalar |
| OCR | Google Vision exige API key no prod | sem a key, use `OCR_PROVIDER=none` (busca manual) |

## Segurança obrigatória antes de divulgar

- [x] `JWT_SECRET` real (gerado automaticamente no Render; o back avisa no log se estiver no default).
- [x] `.env` fora do git (`.gitignore`), credenciais só no painel do Render.
- [ ] JWT em HttpOnly cookie (hoje vai em `localStorage`) — item de backlog antes de abrir para o público.
- [ ] Termos de uso / política de privacidade se houver contas de terceiros.
