#!/usr/bin/env python3
"""
Gradi og-image.png i apple-touch-icon.png iz podataka o servisu i tokena teme.

ZAŠTO SKRIPTA, A NE RUČNO NACRTANA SLIKA
----------------------------------------
Naziv servisa u `frontend/src/config/site.ts` je podatak koji klijent mijenja.
Kad ga promijeni, slika za dijeljenje linka mora se promijeniti s njim, inače
Viber i Facebook mjesecima prikazuju stari naziv. Ova skripta čita naziv i
boje iz izvora istine, pa se pokreće ponovno umjesto da se slika prepravlja.

ZAŠTO PNG, A NE SVG
-------------------
Facebook, WhatsApp, Viber, LinkedIn i X ne prikazuju SVG kao og:image.
Prethodna verzija projekta pokazivala je na `/og-image.svg`, što znači da
podijeljeni link nije imao sliku ni na jednoj od tih platformi.

POKRETANJE
----------
    pip install pillow fonttools brotli
    python3 scripts/build-og-image.py

Pismo se dohvaća s Google Fontsa kao podskup točno onih znakova koji su u
nazivu — ne ugrađuje se u repozitorij i ne poslužuje se posjetiteljima
(stranica i dalje koristi vlastite self-hostane datoteke iz public/fonts).
"""

from __future__ import annotations

import io
import math
import pathlib
import re
import sys
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = ROOT / "frontend/src/styles/theme.css"
SITE = ROOT / "frontend/src/config/site.ts"
OUT_DIR = ROOT / "frontend/public"

W, H = 1200, 630
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"


def tokens() -> dict[str, tuple[int, int, int]]:
    """Boje dolaze iz theme.css, da slika ne odluta od sustava."""
    css = THEME.read_text(encoding="utf-8")
    found = re.findall(r"--color-([a-z]+-\d+):\s*#([0-9a-fA-F]{6})", css)
    if not found:
        sys.exit(f"Nijedan token boje nije pronađen u {THEME}")
    return {name: tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) for name, h in found}


def site_value(key: str) -> str:
    """Čita jedno polje iz site.ts. Namjerno bez parsera — traži se točno
    `key: '...'` na početku retka, pa krivi pogodak nije tih: skripta stane."""
    src = SITE.read_text(encoding="utf-8")
    match = re.search(rf"^\s*{key}:\s*'([^']*)'", src, re.M)
    if not match:
        sys.exit(f"Polje '{key}' nije pronađeno u {SITE}")
    return match.group(1)


def google_font(text: str, *, italic: bool, weight: int, width: int) -> bytes:
    """Podskup s točno onim znakovima koji se traže — obično ispod 5 kB."""
    ital = 1 if italic else 0
    family = f"Archivo:ital,wdth,wght@{ital},{width},{weight}"
    url = (
        "https://fonts.googleapis.com/css2?"
        + urllib.parse.urlencode({"family": family, "text": text})
    )
    css = urllib.request.urlopen(  # noqa: S310 - fiksni, poznati host
        urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30
    ).read().decode()
    found = re.search(r"https://fonts\.gstatic\.com/[^)]+", css)
    if not found:
        sys.exit("Google Fonts nije vratio nijednu datoteku pisma.")
    woff2 = urllib.request.urlopen(found.group(0), timeout=30).read()  # noqa: S310

    from fontTools.ttLib import TTFont

    font = TTFont(io.BytesIO(woff2))
    font.flavor = None
    buf = io.BytesIO()
    font.save(buf)
    return buf.getvalue()


def load(text: str, size: int, *, italic: bool, weight: int, width: int):
    from PIL import ImageFont

    return ImageFont.truetype(io.BytesIO(google_font(text, italic=italic, weight=weight, width=width)), size)


def spotlight(base, colour, cx: int, cy: int, radius: int, peak: float):
    """Reflektor — isti radijalni potez koji `.spotlight` radi u CSS-u."""
    from PIL import Image

    glow = Image.new("L", (W, H), 0)
    px = glow.load()
    for y in range(H):
        dy = (y - cy) ** 2
        for x in range(0, W, 2):
            d = math.sqrt((x - cx) ** 2 + dy)
            if d >= radius:
                continue
            value = int(255 * peak * (1 - d / radius) ** 2.2)
            px[x, y] = value
            if x + 1 < W:
                px[x + 1, y] = value
    base.paste(Image.new("RGB", (W, H), colour), (0, 0), glow)


def brand_mark(draw, cx: int, cy: int, r: int, body, accent):
    """Znak marke: guma i luk svjetla, isti kao BrandMark.tsx."""
    ring = max(2, round(r * 0.22))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=body, width=ring)
    hub = round(r * 0.34)
    draw.ellipse([cx - hub, cy - hub, cx + hub, cy + hub], outline=body, width=ring)
    for angle in (270, 30, 150):  # tri prečke
        a = math.radians(angle)
        draw.line(
            [
                cx + hub * math.cos(a) * 1.55,
                cy + hub * math.sin(a) * 1.55,
                cx + r * math.cos(a) * 0.58,
                cy + r * math.sin(a) * 0.58,
            ],
            fill=body,
            width=max(1, round(r * 0.125)),
        )
    # Luk svjetla pada s gornje lijeve strane: 180° -> 285°
    draw.arc([cx - r, cy - r, cx + r, cy + r], 180, 285, fill=accent, width=ring + 2)


def main() -> None:
    from PIL import Image, ImageDraw

    t = tokens()
    name = site_value("name")
    tagline = site_value("tagline")
    url = re.sub(r"^https?://", "", site_value("url"))

    img = Image.new("RGB", (W, H), t["midnight-950"])
    spotlight(img, t["volt-500"], cx=140, cy=-40, radius=760, peak=0.20)
    spotlight(img, t["midnight-500"], cx=W + 80, cy=H + 80, radius=620, peak=0.55)
    draw = ImageDraw.Draw(img)

    brand_mark(draw, cx=96, cy=96, r=40, body=(255, 255, 255), accent=t["volt-500"])

    # Naziv se lomi na riječi i slaže jedna ispod druge, kao na tisku.
    words = name.upper().split()
    font = load("".join(set("".join(words))) + " ", 118, italic=True, weight=800, width=75)
    y = 210
    for word in words:
        draw.text((90, y), word, font=font, fill=(255, 255, 255))
        y += 122

    draw.rectangle([90, y + 18, 90 + 190, y + 28], fill=t["volt-500"])

    small = load(tagline + url + " ", 30, italic=False, weight=500, width=100)
    draw.text((90, y + 62), tagline, font=small, fill=t["asphalt-300"])
    draw.text((90, H - 64), url, font=small, fill=t["volt-500"])

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    og = OUT_DIR / "og-image.png"
    img.save(og, "PNG", optimize=True)
    print(f"{og.relative_to(ROOT)}  {og.stat().st_size // 1024} kB  {W}x{H}")

    # apple-touch-icon: iOS ne prihvaća SVG, pa treba pravi raster.
    icon_size = 180
    icon = Image.new("RGB", (icon_size, icon_size), t["midnight-900"])
    brand_mark(
        ImageDraw.Draw(icon),
        cx=icon_size // 2,
        cy=icon_size // 2,
        r=58,
        body=(255, 255, 255),
        accent=t["volt-500"],
    )
    touch = OUT_DIR / "apple-touch-icon.png"
    icon.save(touch, "PNG", optimize=True)
    print(f"{touch.relative_to(ROOT)}  {touch.stat().st_size // 1024} kB  {icon_size}x{icon_size}")


if __name__ == "__main__":
    main()
