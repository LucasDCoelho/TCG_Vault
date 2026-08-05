from datetime import datetime

from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    mode: str  # "google" | "dev"
    url: str | None = None
    token: str | None = None
    user: UserOut | None = None
    dev_warning: str | None = None


class ScryfallCard(BaseModel):
    name: str
    set_name: str
    set_code: str
    collector_number: str
    rarity: str
    image_uri: str = ""
    scryfall_uri: str = ""
    price_usd: float | None = None
    printed_name: str = ""
    printed_type_line: str = ""
    description: str = ""


class ScanResponse(BaseModel):
    scan_id: str
    ocr_provider: str
    recognized_text: str = ""
    candidates: list[ScryfallCard] = []
    message: str = ""


class CardCreate(BaseModel):
    name: str
    set_name: str = ""
    set_code: str = ""
    collector_number: str = ""
    rarity: str = ""
    image_uri: str = ""
    scryfall_uri: str = ""
    price_usd: float | None = None
    printed_name: str = ""
    printed_type_line: str = ""
    description: str = ""


class CardOut(CardCreate):
    id: int
    photo_url: str = ""
    created_at: datetime

    class Config:
        from_attributes = True
