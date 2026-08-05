# RabbitLab · TCG Vault

Cofre digital de cartas de TCG. Fotografe uma carta, o sistema reconhece
(OCR + base de cartas), e você guarda ela organizada na sua conta.

**Stack:** Angular 20 (front) · Python/FastAPI + SQLite (back) · Google OAuth
(opcional no dev) · OCR pluggável (Google Vision / Tesseract / none) · Scryfall (base MTG).

## Estrutura

```
projeto_a/
├── back/    → API FastAPI (Python 3.13+)
├── front/   → SPA Angular 20
├── DESIGN.md  → identidade visual (laranja/branco)
└── .specs/    → documentação do projeto (visão, roadmap, estado, codebase)
```

## Rodar o back

```bash
cd back
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
cp .env.example .env                                       # ajustar se quiser
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
```

- Sem credenciais Google: modo dev (login mock) — o `.env.example` já cobre.
- Configurar OAuth real: preencher `GOOGLE_CLIENT_ID/SECRET` e, para OCR,
  `OCR_PROVIDER=google` + `GOOGLE_API_KEY`.
- Docs interativos em `http://localhost:8000/docs`.

## Rodar o front

```bash
cd front
npm install
npm start        # http://localhost:4200
```

O front chama a API em `http://localhost:8000` direto (CORS habilitado).
Back e front devem rodar juntos.

## Fluxo principal

1. Login (Google ou modo dev).
2. **Escanear** → enviar foto da carta → OCR tenta reconhecer → candidatos
   da Scryfall → confirmar → salva no cofre (com a foto enviada).
3. **Cofre** → grid das cartas, ver detalhe, remover.

## Verificação

```bash
# Back (smoke de API)
cd back && .venv/Scripts/python -c "from fastapi.testclient import TestClient; from app.main import app; c=TestClient(app); print(c.get('/health').json())"

# Front (build + testes)
cd front && npm run build && npm run test -- --watch=false --browsers=ChromeHeadless
```

## Documentação de projeto

Ver `.specs/` — visão (`project/PROJECT.md`), roadmap, decisões
(`project/STATE.md`) e mapeamento do codebase (`codebase/`).
