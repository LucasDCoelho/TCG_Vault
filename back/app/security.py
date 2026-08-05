from datetime import datetime, timedelta, timezone

from fastapi import Cookie, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User

_bearer = HTTPBearer(auto_error=False)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def set_auth_cookie(response: Response, token: str) -> None:
    """Sessão em cookie HttpOnly (inacessível a JS — mitiga XSS)."""
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.cookie_name,
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    access_token: str | None = Cookie(default=None, alias=settings.cookie_name),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials if credentials else access_token
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token ausente")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        sub = payload.get("sub")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
    if not sub:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")
    user = db.query(User).filter(User.google_sub == sub).first()
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário não encontrado")
    return user
