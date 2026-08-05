# ARCHITECTURE

## Visão de fluxo (MVP)

```
[Angular SPA :4200] --HTTP/JSON(JWT)--> [FastAPI :8000]
   login  /auth/login ──► Google OAuth (ou mock dev) ──► JWT
   scan   /scan (multipart) ──► OCR ──► Scryfall search ──► candidatos
   cofre  /cards (CRUD) ──► SQLite ──► fotos em /uploads
```

## Decisões estruturais

- **Back stateless por requisição:** o scan NÃO persiste imagem intermediária —
  o front guarda o arquivo e o reenvia no POST /cards. Simples, sem estado
  temporal no servidor; custa um upload duplicado (aceitável ≤10MB).
- **Auth de 2 passos:** `/auth/login` decide o modo (google → URL de redirecionamento;
  dev → token mock direto). Callback Google redireciona para
  `FRONTEND_URL/auth/callback?token=JWT`.
- **JWT em localStorage** no front; interceptor injeta `Authorization: Bearer`.
  Trade-off: XSS superficial — aceitável para MVP; revisar (HttpOnly cookie) no pós-MVP.
- **OCR desacoplado:** `ocr.extract_text` escolhe provider por env, com import
  sob demanda (pytesseract não bloqueia startup se ausente). Sem provider → o
  front cai para busca manual na Scryfall.
- **CORS:** back libera `http://localhost:4200`. Front chama o back direto na
  porta 8000 (sem proxy), para manter o fluxo de uploads simples.
- **Banco:** `create_all` no import (idempotente). Sem migrations (Alembic) ainda —
  decisão consciente para MVP.

## Dados

- `User`: identidade Google (`google_sub` único).
- `Card`: pertence a `user_id`; guarda metadados (nome, coleção, raridade, preço),
  URL oficial da imagem (Scryfall) e `photo_path` da foto enviada pelo usuário.
