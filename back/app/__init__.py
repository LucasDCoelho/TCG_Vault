"""RabbitLab TCG Vault — backend.

FastAPI + SQLite. Rotas:
  /auth      → Google OAuth (ou modo dev), JWT
  /scan      → OCR + match na base de cartas (Scryfall)
  /cards     → cofre (CRUD)

Rodar:
  uvicorn app.main:app --reload --port 8000
"""
