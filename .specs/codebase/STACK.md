# STACK

## Front — `front/`
- **Framework:** Angular 20 (standalone components, signals, `@angular/build` application builder)
- **Linguagem:** TypeScript
- **Estilo:** SCSS + design tokens CSS custom properties (ver `DESIGN.md`)
- **HTTP:** `@angular/common/http` com interceptor de JWT
- **Testes:** Karma + Jasmine (ChromeHeadless)
- **Node requerido:** ^20.19 || ^22.12 (CLI Angular 20; Node 22.19 OK)

## Back — `back/`
- **Framework:** FastAPI (Python 3.13+)
- **ORM:** SQLAlchemy 2.x
- **Banco:** SQLite (arquivo local `tcgvault.db`) — migração futura para Postgres
- **Auth:** Google OAuth2 (authorization-code) + JWT (python-jose)
- **OCR:** pluggável via `OCR_PROVIDER` (google=Cloud Vision REST, tesseract local, none)
- **Base de cartas:** Scryfall REST API (MTG), cliente com cache em memória
- **Uploads:** arquivos salvos em `back/uploads/`, servidos via `StaticFiles`
- **Testes:** smoke via `fastapi.testclient` (sem suíte formal ainda)
