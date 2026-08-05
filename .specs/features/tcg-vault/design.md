# TCG Vault — Design (arquitetura)

## Decisões de domínio (áreas cinzas)
Registradas em `context.md`. Resumo: OCR via API + fallback manual; SQLite;
Google OAuth; base de cartas Scryfall (MTG) no MVP.

## Arquitetura de solução

```
LoginPage ──► /auth/login ──► Google OAuth | dev mock ──► JWT ──► AuthService(signal)
ScanPage  ──► POST /scan (imagem) ──► ocr.extract_text ──► scryfall.search ──► candidatos
             └─► confirmar ──► POST /cards (multipart + foto) ──► SQLite + /uploads
VaultPage ─► GET /cards ──► grid ──► detail ──► DELETE /cards/:id
```

## Componentes-chave

| Peça | Responsabilidade |
|------|------------------|
| `config.Settings` | Toda config via env, com defaults dev |
| `security` | JWT emit/verify + dependency `get_current_user` |
| `routers/auth` | Fluxo OAuth completo + modo dev |
| `ocr` | Provider pluggável (google/tesseract/none) |
| `scryfall` | Busca + cache TTL 5min + normalização de faces duplas |
| `routers/scan` | Upload, validação (tipo/tamanho), heurística de nome |
| `routers/cards` | CRUD com ownership check, persistência de foto |
| Front `AuthService` | Estado de sessão (signals) + logout |
| Front `ScanPage` | Drop zone, OCR, seleção de candidato, fallback manual |
| Front `VaultPage` | Grid, delete com confirmação, empty state |
| Front `TopNav` | Navegação + sessão |

## Padrões de dados
- `User(google_sub UNIQUE, email, name, avatar_url)`
- `Card(user_id FK, name, set_*, collector_number, rarity, image_uri, scryfall_uri, price_usd, photo_path, created_at)`

## Trade-offs aceitos
- Scan stateless (front reenvia foto no confirmar) → simplicidade vs. upload duplicado.
- `create_all` sem migrations → simplicidade vs. evolução de schema.
- Scryfall só MTG no MVP → foco vs. "qualquer TCG" do pedido original.
- JWT em localStorage → simplicidade vs. superfície de XSS.
