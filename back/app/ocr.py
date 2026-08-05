import base64

import httpx

from .config import settings


def extract_text(image_bytes: bytes) -> str:
    """Extrai texto de uma imagem via provider configurado.

    Providers: google (Cloud Vision REST) | tesseract (local) | none.
    Nunca falha no startup: importa libs sob demanda.
    """
    provider = settings.ocr_provider
    if provider == "google" and settings.google_api_key:
        try:
            return _google_vision(image_bytes)
        except Exception:
            return ""
    if provider == "tesseract":
        try:
            return _tesseract(image_bytes)
        except Exception:
            return ""
    return ""


def _google_vision(image_bytes: bytes) -> str:
    encoded = base64.b64encode(image_bytes).decode()
    payload = {
        "requests": [
            {
                "image": {"content": encoded},
                "features": [{"type": "TEXT_DETECTION"}],
            }
        ]
    }
    resp = httpx.post(
        "https://vision.googleapis.com/v1/images:annotate",
        params={"key": settings.google_api_key},
        json=payload,
        timeout=20,
    )
    resp.raise_for_status()
    annotations = resp.json().get("responses", [{}])[0].get("textAnnotations", [])
    return annotations[0]["description"] if annotations else ""


def _tesseract(image_bytes: bytes) -> str:
    from PIL import Image
    import pytesseract
    import io

    return pytesseract.image_to_string(Image.open(io.BytesIO(image_bytes)))
