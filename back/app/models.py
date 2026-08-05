from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    google_sub: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), default="")
    name: Mapped[str] = mapped_column(String(255), default="")
    avatar_url: Mapped[str] = mapped_column(String(512), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    set_name: Mapped[str] = mapped_column(String(255), default="")
    set_code: Mapped[str] = mapped_column(String(16), default="")
    collector_number: Mapped[str] = mapped_column(String(32), default="")
    rarity: Mapped[str] = mapped_column(String(32), default="")
    image_uri: Mapped[str] = mapped_column(String(512), default="")
    scryfall_uri: Mapped[str] = mapped_column(String(512), default="")
    price_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    printed_name: Mapped[str] = mapped_column(String(255), default="")
    printed_type_line: Mapped[str] = mapped_column(String(255), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    photo_path: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
