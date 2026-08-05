from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .config import settings
from .database import init_db
from .routers import auth, cards, scan

ALLOWED_ORIGINS = [settings.frontend_url, "http://localhost:4200"]

app = FastAPI(title=settings.app_name, version="0.1.0")

if settings.jwt_secret == "dev-secret-change-me":
    print(
        "ATENCAO: JWT_SECRET em uso eh o default. Defina JWT_SECRET (env) "
        "antes de expor este servico em producao."
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def csrf_origin_check(request: Request, call_next):
    """Mitiga CSRF: requisições mutáveis de navegador devem trazer Origin permitido.

    Navegadores sempre enviam Origin em POST/DELETE cross-origin; atacantes não
    podem forjá-lo. Requests sem Origin (curl, testes, serviços) são aceitos."""
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")
        if origin and origin not in ALLOWED_ORIGINS:
            return JSONResponse(status_code=403, content={"detail": "Origem não permitida"})
    return await call_next(request)


app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(cards.router)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
init_db()


app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name, "ocr_provider": settings.ocr_provider, "google_enabled": settings.google_enabled}
