from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import LoginResponse, UserOut
from ..security import clear_auth_cookie, create_access_token, get_current_user, set_auth_cookie
import httpx

router = APIRouter(prefix="/auth", tags=["auth"])

DEV_SUB = "dev-user"


def _google_auth_url() -> str:
    return (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        "&response_type=code"
        "&scope=openid email profile"
        "&prompt=select_account"
    )


def _upsert_user(db: Session, sub: str, email: str, name: str, avatar: str) -> User:
    user = db.query(User).filter(User.google_sub == sub).first()
    if user is None:
        user = User(google_sub=sub, email=email, name=name, avatar_url=avatar)
        db.add(user)
    else:
        user.email = email
        user.name = name or user.name
        user.avatar_url = avatar or user.avatar_url
    db.commit()
    db.refresh(user)
    return user


def _dev_login(db: Session) -> User:
    return _upsert_user(db, DEV_SUB, "dev@rabbitlab.local", "Usuário Dev", "")


@router.get("/login", response_model=LoginResponse)
def login(response: Response, db: Session = Depends(get_db)):
    if not settings.google_enabled:
        user = _dev_login(db)
        set_auth_cookie(response, create_access_token(user.google_sub))
        return LoginResponse(
            mode="dev",
            user=UserOut.model_validate(user),
            dev_warning="MODO DEV: Google OAuth não configurado. Usuário mock autenticado.",
        )
    return LoginResponse(mode="google", url=_google_auth_url())


@router.get("/callback")
def callback(code: str = Query(...), db: Session = Depends(get_db)):
    """Troca o code do Google por token, autentica e redireciona ao front.

    O JWT vai no cookie HttpOnly da resposta (nunca aparece na URL). O front
    então chama /auth/me com o cookie para fechar a sessão."""
    if not settings.google_enabled:
        user = _dev_login(db)
        redirect = RedirectResponse(f"{settings.frontend_url}/auth/callback")
        set_auth_cookie(redirect, create_access_token(user.google_sub))
        return redirect

    token_resp = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "code": code,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if token_resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Falha ao trocar code do Google")

    access_token = token_resp.json()["access_token"]
    info = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    ).json()

    user = _upsert_user(
        db,
        sub=info["id"],
        email=info.get("email", ""),
        name=info.get("name", ""),
        avatar=info.get("picture", ""),
    )
    jwt_token = create_access_token(user.google_sub)
    redirect = RedirectResponse(f"{settings.frontend_url}/auth/callback")
    set_auth_cookie(redirect, jwt_token)
    return redirect


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.post("/logout")
def logout(response: Response):
    clear_auth_cookie(response)
    return {"ok": True}
