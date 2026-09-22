"""
Čitanje boja i podataka o servisu iz izvora istine.

Dijele ga `build-og-image.py` i `build-images.py`. Obje skripte crtaju nešto
što mora izgledati kao ostatak stranice, pa boje ne smiju biti prepisane u
Python — kad se `theme.css` promijeni, slike se pregeneriraju i prate ga.
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = ROOT / "frontend/src/styles/theme.css"
SITE = ROOT / "frontend/src/config/site.ts"
FONTS = ROOT / "frontend/public/fonts"


def tokens() -> dict[str, tuple[int, int, int]]:
    """Sve `--color-*` vrijednosti iz theme.css kao RGB trojke."""
    css = THEME.read_text(encoding="utf-8")
    found = re.findall(r"--color-([a-z]+-\d+):\s*#([0-9a-fA-F]{6})", css)
    if not found:
        sys.exit(f"Nijedan token boje nije pronađen u {THEME}")
    return {name: tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) for name, h in found}


def site_value(key: str) -> str:
    """Jedno polje iz site.ts.

    Namjerno bez pravog parsera — traži se točno `key: '...'` na početku
    retka. Ako se oblik datoteke promijeni, skripta stane s jasnom porukom
    umjesto da tiho upiše krivu vrijednost u sliku.
    """
    src = SITE.read_text(encoding="utf-8")
    match = re.search(rf"^\s*{key}:\s*'([^']*)'", src, re.M)
    if not match:
        sys.exit(f"Polje '{key}' nije pronađeno u {SITE}")
    return match.group(1)


def repo_font(size: int, *, weight: int = 700, width: int = 100):
    """Pismo iz `public/fonts`, pretvoreno u nešto što PIL zna čitati.

    Uzima se ono koje stranica ionako poslužuje, a ne neko sa sustava:
    slika tako izgleda isto na svakom računalu i ne treba mrežu. PIL ne
    čita woff2, pa se kompresija skida u memoriji — datoteka na disku se
    ne dira.
    """
    import io

    from fontTools.ttLib import TTFont
    from PIL import ImageFont

    source = FONTS / "archivo-latin.woff2"
    if not source.exists():
        sys.exit(f"Pismo nije pronađeno: {source}")

    font_file = TTFont(str(source))
    font_file.flavor = None
    buffer = io.BytesIO()
    font_file.save(buffer)
    buffer.seek(0)

    font = ImageFont.truetype(buffer, size)
    # Archivo je varijabilan; bez ovoga bi se koristila zadana težina 600.
    try:
        font.set_variation_by_axes([weight, width])
    except Exception:  # noqa: BLE001 - statični rez je posve upotrebljiv
        pass
    return font
