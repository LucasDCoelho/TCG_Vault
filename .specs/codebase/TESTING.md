# TESTING

## Front (Angular)
- Runner: Karma + Jasmine + ChromeHeadless.
- Suíte atual: `app.spec.ts` (smoke do root com TopNav). Sem specs de páginas ainda.
- Rodar:
  ```bash
  cd front && npm run test -- --watch=false --browsers=ChromeHeadless
  ```
- Gate de build: `npm run build` (sem erros TS/template).

## Back (Python)
- Sem suíte formal. Smoke manual via `TestClient`:
  ```bash
  cd back && .venv/Scripts/python -c "
  from fastapi.testclient import TestClient
  from app.main import app
  c = TestClient(app)
  print(c.get('/health').json())
  "
  ```
- Fluxos verificados manualmente (2026-08-05):
  health, login dev, /me, search Scryfall, CRUD completo de carta com upload de imagem, 401 sem token, CORS preflight.

## Lacunas conhecidas
- Sem testes de integração automatizados back-end.
- Sem specs de componente/página no front.
- OCR google/tesseract não testados (dependem de credencial/binário).
- Fluxo real de OAuth Google não testado (requer credenciais).
