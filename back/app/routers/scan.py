from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from ..config import settings
from ..ocr import extract_text
from ..schemas import ScanResponse, ScryfallCard
from ..scryfall import scryfall

router = APIRouter(prefix="/scan", tags=["scan"])

_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


def _guess_card_name(recognized_text: str) -> str:
    """Heurística leve: nome da carta costuma ser a primeira linha do OCR."""
    for line in recognized_text.splitlines():
        line = line.strip()
        if not line:
            continue
        # remove sufixos comuns tipo "(a)", "(b)" em cartas duplas
        name = line.split("—")[0].split("(")[0].strip(" .,;:-")
        words = name.split()
        if 1 <= len(words) <= 6:
            return " ".join(words[:6])
        return " ".join(words[:6])
    return ""


@router.post("", response_model=ScanResponse)
async def scan(file: UploadFile = File(...)):
    if file.content_type not in _IMAGE_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Formato de imagem não suportado (use JPEG/PNG/WebP)")
    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"Imagem acima de {settings.max_upload_mb}MB")

    recognized = extract_text(data)
    candidates: list[ScryfallCard] = []
    message = ""

    if recognized:
        query = _guess_card_name(recognized)
        candidates = scryfall.search(query) if query else []
        if not candidates:
            message = "Não encontramos a carta no OCR. Tente buscar manualmente."
    else:
        message = "OCR não disponível/configurado. Use a busca manual."

    return ScanResponse(
        scan_id=str(uuid4()),
        ocr_provider=settings.ocr_provider,
        recognized_text=recognized,
        candidates=candidates,
        message=message,
    )


@router.get("/search", response_model=list[ScryfallCard])
def search(q: str = Query(..., min_length=2)):
    """Busca manual na base de cartas — fallback quando o OCR não resolve."""
    return scryfall.search(q)
