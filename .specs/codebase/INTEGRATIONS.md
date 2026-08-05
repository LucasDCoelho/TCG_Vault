# INTEGRATIONS

| Serviço | Uso | Auth | Notas de rede |
|---------|-----|------|---------------|
| Google OAuth2 | Login social | Credenciais `GOOGLE_CLIENT_ID/SECRET` (env) | Redirecionamentos browser; callback em `/auth/callback` |
| Google Cloud Vision | OCR | `GOOGLE_API_KEY` (env) | REST `vision.googleapis.com`; ativo com `OCR_PROVIDER=google` |
| Tesseract | OCR local | — | Binário do sistema + `pytesseract` (import sob demanda) |
| Scryfall API | Base de cartas MTG | Sem chave | `api.scryfall.com/cards/search`; rate limit ~10 req/s → cache TTL 5min |

## Busca localizada (cartas em português)
- Scryfall não tem operador `printed:`. Para cartas impressas em PT, usar o
  termo SOLTO + `lang:pt` (ex.: `Raio lang:pt`) — casa com `printed_name`.
- Fluxo no `scryfall.py`: busca EN primeiro; se a busca PT tiver match EXATO do
  nome impresso, ela vence; senão, EN; senão, candidatos PT.
- O campo `printed_name` é retornado e exibido no front junto do nome inglês.

## Modo dev (sem credenciais)
- OAuth ausente → `/auth/login` retorna `mode=dev` com JWT mock.
- OCR ausente → scan retorna `candidates=[]` com mensagem; front oferece busca manual.
- Front exibe aviso "MODO DEV" quando aplicável.

## Contratos relevantes
- Base URL da API: `http://localhost:8000` (CORS aberto para `http://localhost:4200`).
- Uploads servidos em `/uploads/<file>` (estático).
- Formato multipart do `POST /cards`: campos `name`, `set_name`, `set_code`,
  `collector_number`, `rarity`, `image_uri`, `scryfall_uri`, `price_usd?`, `photo?`.
