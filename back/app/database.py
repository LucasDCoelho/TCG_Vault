from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
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
