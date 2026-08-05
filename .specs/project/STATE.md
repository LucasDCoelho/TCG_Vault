# STATE — Memória do projeto

> Última atualização: 2026-08-05. **MVP no ar** (Vercel + Render + OAuth Google funcionando ponta a ponta).

## Status

- **Fase atual:** MVP publicado. Front no Vercel, back no Render (Postgres), login Google funcionando, proxy `/api/*` conectando os dois.
- **Última atualização:** 2026-08-05
- **Próxima ação:** decidir entre divulgar para testadores (segurança: HttpOnly cookie antes) ou atacar features de produto (mais TCGs / filtros).

## Decisões registradas

| Data | Decisão | Justificativa | Trade-off |
|------|---------|---------------|-----------|
| 2026-08-05 | Sessão em cookie HttpOnly (`SameSite=None; Secure`) em vez de JWT no localStorage | Token inacessível a JS (mitiga XSS); cookie atravessa SSO | Front precisa falar direto com o back (cross-origin); anti-CSRF via checagem de Origin; proxy do Vercel removido |
| 2026-08-05 | Deploy MVP: front Vercel (proxy `/api/*`), back Render (Blueprint), Postgres opcional | Front estático + API são ambientes independentes; proxy elimina CORS em produção | Back free tier dorme (cold start ~40s); SQLite/upload efêmeros sem Postgres |
| 2026-08-05 | Cartas PT exibem nome/tipo/descrição localizados (`printed_name`, `printed_type_line`, `description`) | Usuário quer conteúdo em português | Descrição cai para inglês (oracle_text) quando não há impressão PT; preço segue USD |
| 2026-08-05 | Suporte a cartas PT: busca localizada `lang:pt` com match exato do `printed_name` | OCR lê nome impresso; Scryfall não tem operador `printed:` | 2 chamadas por scan quando sem match EN (cache 5min) |
| 2026-08-05 | Credenciais Google reais configuradas em `back/.env` (OAuth + Vision) | Login real + OCR funcionando | Segredo no ambiente local; `.env` gitignored |
| 2026-08-05 | Back em Python/FastAPI (não Java) | Mais simples para MVP | Ecossistema Java não usado |
| 2026-08-05 | Banco SQLite | Zero config | Concorrência limitada |
| 2026-08-05 | Auth Google OAuth2 | Menos fricção | Exige credenciais p/ produção |
| 2026-08-05 | Leitura da carta via OCR (API) + busca manual fallback | Escolha do operador | Dependência externa |
| 2026-08-05 | Base de cartas = Scryfall (MTG) no MVP | Gratuita, sem chave | Cobre só MTG por ora |
| 2026-08-05 | Identidade visual laranja + branco | Escolha do operador | — |
| 2026-08-05 | Angular 20 (CLI 20) em vez da mais nova | Node 22.19 < exigência da Angular mais nova (≥22.22.3) | Versão um release atrás |
| 2026-08-05 | Scan stateless: front reenvia foto no confirmar | Simplicidade | Upload duplicado (≤10MB) |
| 2026-08-05 | JWT em localStorage | Simplicidade | Superfície de XSS (revisar pós-MVP) |
| 2026-08-05 | `create_all` sem Alembic | Simplicidade MVP | Migrações manuais |

## Bloqueios atuais

- Nenhum em dev. Produção depende de: credenciais Google OAuth (OAuth2 consent),
  chave do Cloud Vision (ou binário Tesseract) e troca do `JWT_SECRET`.

## Lições

- StaticFiles do Starlette exige o diretório existir no momento do import — criar
  no nível de módulo, não no evento de startup.
- `TestClient` sem context manager não roda lifespan — criar schema no import
  (`create_all`) em vez de depender de startup.
- Campo inicializado com `this.xxx` no corpo da classe roda antes do DI no
  constructor — usar o parâmetro do construtor como `protected` direto.
- Angular CLI mais nova exige Node ≥22.22.3; Node 22.19 → Angular 20 (compatível).
- Campo `scryfall` acessado com rota fuzzy `order=relevance` pode trazer cartas
  "piada" (ex: Blacker Lotus) — sempre mostrar lista de candidatos para o usuário.

## Deferred / Backlog

- Outros TCGs (Pokémon, Yu-Gi-Oh, One Piece)
- Cofres múltiplos, preço/valorização, busca avançada
- PWA offline, app mobile
- Migrações Alembic
