from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings


def _normalize_db_url(url: str) -> str:
    """Garante o dialeto psycopg 3 (instalado) para URLs Postgres.

    Sem isso, `postgresql://...` usa psycopg2 (não instalado) e `postgres://...`
    nem é reconhecido pelo SQLAlchemy 2. Providers (ex.: Render) costumam entregar
    a URL sem o sufixo de driver."""
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    return url


database_url = _normalize_db_url(settings.database_url)
connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from . import models  # noqa: F401  (registra models no metadata)

    Base.metadata.create_all(bind=engine)
    _ensure_columns(engine)


def _ensure_columns(db_engine) -> None:
    """Migração leve: adiciona colunas novas a tabelas existentes (SQLite não
    cria coluna nova em tabela já criada via create_all)."""
    import sqlalchemy as sa

    inspector = sa.inspect(db_engine)
    if "cards" not in inspector.get_table_names():
        return
    existing = {col["name"] for col in inspector.get_columns("cards")}
    additions = {
        "printed_name": "VARCHAR(255) NOT NULL DEFAULT ''",
        "printed_type_line": "VARCHAR(255) NOT NULL DEFAULT ''",
        "description": "TEXT NOT NULL DEFAULT ''",
    }
    with db_engine.begin() as conn:
        for col, ddl in additions.items():
            if col not in existing:
                conn.execute(sa.text(f"ALTER TABLE cards ADD COLUMN {col} {ddl}"))
