# TCG Vault — Tasks

> Executadas em 2026-08-05. Status: ✅ concluído.

## Back
- [x] Scaffold FastAPI + SQLite + estrutura de módulos
- [x] Auth Google OAuth (login/callback/me) + modo dev mock
- [x] OCR pluggável (google/tesseract/none) + heurística de nome
- [x] Scryfall client com cache + normalização
- [x] CRUD de cartas com upload de foto + ownership check
- [x] CORS, StaticFiles, health, init_db

## Front
- [x] Scaffold Angular 20 (standalone, scss, routing)
- [x] Design tokens laranja/branco (styles.scss, DESIGN.md)
- [x] AuthService + interceptor JWT + guard
- [x] Login (Google + dev) e AuthCallback
- [x] Vault (grid, empty state, delete, toast)
- [x] Scan (drop zone, OCR, candidatos, busca manual, confirmar)
- [x] Card detail

## Verificação
- [x] Back: smoke TestClient (health, login dev, /me, search, CRUD, 401, CORS)
- [x] Back: servidor real + upload de imagem + list + delete (200/201/204)
- [x] Front: `npm run build` sem erros
- [x] Front: `npm test` (ChromeHeadless) 2/2 verdes

## Pendências
- [ ] Credenciais reais de Google OAuth + Vision para fluxo de produção
- [ ] Suporte a mais TCGs (backlog)
