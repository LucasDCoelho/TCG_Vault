# STRUCTURE

```
projeto_a/
├── .specs/                 # documentação do projeto (kernel)
│   ├── project/            # visão, roadmap, estado
│   ├── codebase/           # este mapeamento
│   └── features/tcg-vault/ # spec + context + design + tasks
├── back/
│   ├── app/
│   │   ├── main.py         # app FastAPI, CORS, mount /uploads, init_db
│   │   ├── config.py       # Settings (pydantic-settings, lê .env)
│   │   ├── database.py     # engine SQLite + SessionLocal + Base
│   │   ├── models.py       # User, Card (SQLAlchemy)
│   │   ├── schemas.py      # DTOs Pydantic (Card, Scan, Login…)
│   │   ├── security.py     # JWT (criar/decodificar) + get_current_user
│   │   ├── ocr.py          # extract_text() pluggável (google/tesseract/none)
│   │   ├── scryfall.py     # cliente Scryfall + cache TTL
│   │   └── routers/
│   │       ├── auth.py     # /auth/login, /auth/callback, /auth/me
│   │       ├── scan.py     # POST /scan (upload→OCR→candidatos), GET /scan/search
│   │       └── cards.py    # CRUD do cofre (/cards)
│   ├── uploads/            # fotos enviadas (runtime, gitignored)
│   ├── requirements.txt
│   └── .env.example
└── front/
    └── src/
        ├── index.html      # título, fontes (Inter), lang pt-BR
        ├── styles.scss     # design tokens (CSS vars) + utilitários
        └── app/
            ├── app.ts/html # root (TopNav + router-outlet)
            ├── app.routes.ts
            ├── app.config.ts
            ├── models/api.ts        # interfaces (Card, User, Scan…)
            ├── services/
            │   ├── api.ts           # API_BASE + helpers de URL
            │   ├── auth.service.ts  # estado de sessão (signals)
            │   └── auth.interceptor.ts  # injeta Bearer token
            ├── guards/auth.guard.ts
            ├── components/top-nav/
            └── pages/
                ├── login/
                ├── auth-callback/
                ├── vault/
                ├── scan/
                └── card-detail/
```
