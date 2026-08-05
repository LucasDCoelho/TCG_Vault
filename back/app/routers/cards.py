import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Card, User
from ..schemas import CardCreate, CardOut
from ..security import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])

_ALLOWED_PHOTO = {"image/jpeg", "image/png", "image/webp"}


def _save_photo(file: UploadFile) -> str:
    if file.content_type not in _ALLOWED_PHOTO:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Foto deve ser JPEG/PNG/WebP")
    data = file.file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"Foto acima de {settings.max_upload_mb}MB")

    ext = Path(file.filename or "photo.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    (upload_dir / filename).write_bytes(data)
    return filename


@router.get("", response_model=list[CardOut])
def list_cards(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cards = db.query(Card).filter(Card.user_id == user.id).order_by(Card.created_at.desc()).all()
    out = []
    for c in cards:
        item = CardOut.model_validate(c)
        item.photo_url = f"/uploads/{c.photo_path}" if c.photo_path else ""
        out.append(item)
    return out


@router.post("", response_model=CardOut, status_code=status.HTTP_201_CREATED)
async def create_card(
    name: str = Form(...),
    set_name: str = Form(""),
    set_code: str = Form(""),
    collector_number: str = Form(""),
    rarity: str = Form(""),
    image_uri: str = Form(""),
    scryfall_uri: str = Form(""),
    price_usd: float | None = Form(None),
    printed_name: str = Form(""),
    printed_type_line: str = Form(""),
    description: str = Form(""),
    photo: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload = CardCreate(
        name=name.strip(),
        set_name=set_name.strip(),
        set_code=set_code.strip(),
        collector_number=collector_number.strip(),
        rarity=rarity.strip(),
        image_uri=image_uri.strip(),
        scryfall_uri=scryfall_uri.strip(),
        price_usd=price_usd,
        printed_name=printed_name.strip(),
        printed_type_line=printed_type_line.strip(),
        description=description.strip(),
    )
    if not payload.name:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Nome da carta é obrigatório")

    photo_path = _save_photo(photo) if photo else ""
    card = Card(user_id=user.id, photo_path=photo_path, **payload.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    out = CardOut.model_validate(card)
    out.photo_url = f"/uploads/{card.photo_path}" if card.photo_path else ""
    return out


def _owned_card(card_id: int, user: User, db: Session) -> Card:
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == user.id).first()
    if card is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Carta não encontrada")
    return card


@router.get("/{card_id}", response_model=CardOut)
def get_card(card_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = _owned_card(card_id, user, db)
    out = CardOut.model_validate(card)
    out.photo_url = f"/uploads/{card.photo_path}" if card.photo_path else ""
    return out


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(card_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = _owned_card(card_id, user, db)
    if card.photo_path:
        (Path(settings.upload_dir) / card.photo_path).unlink(missing_ok=True)
    db.delete(card)
    db.commit()
