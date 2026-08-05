import time
import unicodedata

import httpx

from .config import settings
from .schemas import ScryfallCard

_CACHE_TTL = 300  # segundos


def _norm(text: str) -> str:
    """Lowercase sem acentos — base para cache e comparação de nomes."""
    return "".join(
        c for c in unicodedata.normalize("NFD", text or "") if unicodedata.category(c) != "Mn"
    ).strip().lower()


class ScryfallClient:
    """Cliente da base de cartas Scryfall (MTG) com cache simples em memória.

    Busca em dois passos:
      1. Inglês (nome oracle) — cobre cartas em inglês.
      2. Localizada (`<termo> lang:pt`) — o termo solto casa com `printed_name`,
         encontrando cartas impressas em português a partir do nome impresso
         (ex.: "Raio" → Lightning Bolt).
    """

    def __init__(self) -> None:
        self._cache: dict[str, tuple[float, list[ScryfallCard]]] = {}

    def _get_cached(self, key: str) -> list[ScryfallCard] | None:
        item = self._cache.get(key)
        if not item:
            return None
        ts, cards = item
        if time.time() - ts > _CACHE_TTL:
            self._cache.pop(key, None)
            return None
        return cards

    def _call_search(self, query: str, order: str = "relevance") -> list[ScryfallCard]:
        params = {"q": query, "order": order, "unique": "prints"}
        resp = httpx.get(
            f"{settings.scryfall_base}/cards/search",
            params=params,
            timeout=15,
            headers={"User-Agent": "RabbitLab-TCGVault/0.1", "Accept": "application/json"},
        )
        if resp.status_code == 404:
            return []
        resp.raise_for_status()

        cards = []
        for item in resp.json().get("data", []):
            img = ""
            face_images = item.get("image_uris") or (
                item.get("card_faces", [{}])[0].get("image_uris") if item.get("card_faces") else None
            )
            if face_images:
                img = face_images.get("normal") or face_images.get("large", "")
            price = item.get("prices", {}).get("usd")
            face = item.get("card_faces", [{}])[0] if item.get("card_faces") else item
            printed_type_line = (
                item.get("printed_type_line")
                or face.get("printed_type_line")
                or item.get("type_line")
                or face.get("type_line")
                or ""
            )
            description = (
                item.get("printed_text")
                or face.get("printed_text")
                or item.get("oracle_text")
                or face.get("oracle_text")
                or ""
            )
            cards.append(
                ScryfallCard(
                    name=item.get("name", ""),
                    set_name=item.get("set_name", ""),
                    set_code=item.get("set", ""),
                    collector_number=item.get("collector_number", ""),
                    rarity=item.get("rarity", ""),
                    image_uri=img,
                    scryfall_uri=item.get("scryfall_uri", ""),
                    price_usd=float(price) if price else None,
                    printed_name=item.get("printed_name", ""),
                    printed_type_line=printed_type_line,
                    description=description,
                )
            )
        return cards

    def search(self, query: str, limit: int = 5) -> list[ScryfallCard]:
        norm_q = _norm(query)
        if not norm_q:
            return []

        english = self._english(query, limit)
        localized = self._localized(query)

        # Se a busca localizada tem match EXATO do nome impresso, é a carta certa
        # (ex.: OCR leu "Raio" numa carta PT → Lightning Bolt).
        exact = [c for c in localized if c.printed_name and _norm(c.printed_name) == norm_q]
        if exact:
            return exact[:limit]
        if english:
            return english[:limit]
        return localized[:limit]

    def _english(self, query: str, limit: int) -> list[ScryfallCard]:
        key = f"en:{_norm(query)}"
        cached = self._get_cached(key)
        if cached is not None:
            return cached[:limit]
        cards = self._call_search(query)
        self._cache[key] = (time.time(), cards)
        return cards[:limit]

    def _localized(self, query: str) -> list[ScryfallCard]:
        norm_q = _norm(query)
        key = f"pt:{norm_q}"
        cached = self._get_cached(key)
        if cached is not None:
            return cached

        cards = self._call_search(f"{query} lang:pt")
        if not cards:
            cards = self._call_search(f"{norm_q} lang:pt")

        # Ordena: match exato do nome impresso primeiro, depois contém, depois resto.
        def score(card: ScryfallCard) -> tuple[int, int]:
            printed = _norm(card.printed_name)
            if printed == norm_q:
                return (0, 0)
            if norm_q in printed or printed in norm_q:
                return (1, 0)
            return (2, 0)

        cards = sorted(cards, key=score)
        self._cache[key] = (time.time(), cards)
        return cards


scryfall = ScryfallClient()
