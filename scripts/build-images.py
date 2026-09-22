#!/usr/bin/env python3
"""
Gradi responzivne izvedenice fotografija i manifest koji ih opisuje.

ZAŠTO OVO POSTOJI
-----------------
Prije ovoga projekt nije imao nijednu fotografiju ni ikakav alat za slike.
Ubaciti `<img src="foto.jpg">` bilo bi najbrže i najgore: jedna datoteka od
4 MB na mobitelu, skok rasporeda dok se učitava, i JPEG tamo gdje AVIF radi
isti posao uz trećinu težine.

Skripta iz svakog originala radi AVIF i WebP u tri širine, JPEG kao zadnju
zamjenu, i zapisuje STVARNE dimenzije u `frontend/src/config/photos.ts`.
Dimenzije iz manifesta idu u `width`/`height` na `<img>`, pa preglednik
rezervira prostor prije nego slika stigne i raspored ne poskoči.

ZAMJENSKE PLOČE
---------------
Ako original za neko mjesto ne postoji, skripta NE puca nego nacrta
označenu zamjensku ploču u bojama teme. Razlog: stranica mora raditi i
prije nego klijent pošalje fotografije, a prazno mjesto se previdi —
ploča s natpisom „ZAMJENSKA FOTOGRAFIJA" se ne previdi. Manifest takvo
mjesto označi s `placeholder: true`, pa se u sučelju može prikazati
upozorenje.

POKRETANJE
----------
    pip install pillow fonttools brotli
    python3 scripts/build-images.py

Originali idu u `frontend/public/foto/izvor/` pod nazivom mjesta
(npr. `radionica-hero.jpg`). Podržani su .jpg, .jpeg, .png i .webp.
"""

from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from theme_tokens import ROOT, repo_font, tokens  # noqa: E402

FOTO = ROOT / "frontend/public/foto"
IZVOR = FOTO / "izvor"
MANIFEST = ROOT / "frontend/src/config/photos.ts"

SOURCE_SUFFIXES = (".jpg", ".jpeg", ".png", ".webp")

# Kvaliteta je odabrana po formatu, ne jednim brojem za sve: AVIF na 50
# izgleda kao JPEG na 80 uz otprilike pola težine.
AVIF_QUALITY = 50
WEBP_QUALITY = 78
JPEG_QUALITY = 82


class Slot:
    """Jedno mjesto za fotografiju na stranici."""

    def __init__(self, name: str, ratio: tuple[int, int], widths: list[int], note: str):
        self.name = name
        self.ratio = ratio
        self.widths = widths
        self.note = note

    def height_for(self, width: int) -> int:
        return round(width * self.ratio[1] / self.ratio[0])


SLOTS = [
    Slot("radionica-hero", (16, 9), [960, 1600, 2400], "Pozadina prvog ekrana"),
    Slot("hotel-za-gume", (4, 3), [480, 800, 1200], "Sekcija „Hotel za gume”"),
    Slot("o-nama", (3, 2), [480, 800, 1200], "Stranica „O nama”"),
    Slot("zamjena-guma", (3, 2), [480, 800, 1200], "Uvod stranice „Usluge”"),
]


def find_source(slot: Slot) -> pathlib.Path | None:
    for suffix in SOURCE_SUFFIXES:
        candidate = IZVOR / f"{slot.name}{suffix}"
        if candidate.exists():
            return candidate
    return None


def placeholder(slot: Slot, colour):
    """Označena ploča umjesto fotografije koje još nema.

    Namjerno ružna na način koji se primijeti: puna mornarska ploha, žuta
    traka i natpis. Ako ovo dođe do produkcije, vidi se na prvi pogled.
    """
    from PIL import Image, ImageDraw

    width = max(slot.widths)
    height = slot.height_for(width)
    img = Image.new("RGB", (width, height), colour["midnight-900"])
    draw = ImageDraw.Draw(img)

    # Dijagonalna šrafura — isti potez kao `.hatched` u sučelju za zauzeto.
    step = max(24, width // 40)
    for x in range(-height, width + height, step):
        draw.line([(x, 0), (x + height, height)], fill=colour["midnight-800"], width=step // 3)

    bar = max(6, height // 60)
    draw.rectangle([0, 0, width, bar], fill=colour["volt-500"])
    draw.rectangle([0, height - bar, width, height], fill=colour["volt-500"])

    _label(draw, slot, width, height, colour)
    return img


def _centred(draw, text, font, cx: int, y: int, fill):
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    draw.text((cx - (right - left) // 2 - left, y - top), text, font=font, fill=fill)
    return bottom - top


def _label(draw, slot: Slot, width: int, height: int, colour):
    """Natpis na ploči: što je, i za koje mjesto na stranici.

    Naziv mjesta je tu namjerno — tko god vidi ploču odmah zna koju
    datoteku treba spremiti da je zamijeni.
    """
    big = repo_font(max(18, width // 24), weight=800, width=87)
    small = repo_font(max(12, width // 52), weight=500)

    y = height // 2 - width // 26
    y += _centred(draw, "ZAMJENSKA FOTOGRAFIJA", big, width // 2, y, colour["volt-500"]) + width // 40
    y += _centred(draw, slot.note, small, width // 2, y, colour["midnight-100"]) + width // 90
    _centred(draw, f"izvor/{slot.name}.jpg", small, width // 2, y, colour["midnight-200"])


def cover(img, width: int, height: int):
    """Obrezivanje na zadani omjer iz sredine, pa skaliranje.

    Sredina, a ne vrh: na fotografiji radionice lice i predmet rada gotovo
    su uvijek u sredini kadra, a vrh je strop.
    """
    from PIL import Image

    target = width / height
    source = img.width / img.height
    if source > target:
        new_w = round(img.height * target)
        left = (img.width - new_w) // 2
        img = img.crop((left, 0, left + new_w, img.height))
    elif source < target:
        new_h = round(img.width / target)
        top = (img.height - new_h) // 2
        img = img.crop((0, top, img.width, top + new_h))
    return img.resize((width, height), Image.LANCZOS)


def build(slot: Slot, colour) -> dict:
    from PIL import Image

    source = find_source(slot)
    is_placeholder = source is None

    if source is None:
        img = placeholder(slot, colour)
    else:
        img = Image.open(source)
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

    largest = max(slot.widths)
    if img.width < largest:
        print(
            f"  ! {slot.name}: original je {img.width} px, traži se {largest} px — "
            "slika će biti mekša nego što treba"
        )

    written = []
    for width in slot.widths:
        height = slot.height_for(width)
        resized = cover(img, width, height)
        for suffix, params in (
            ("avif", {"quality": AVIF_QUALITY}),
            ("webp", {"quality": WEBP_QUALITY, "method": 6}),
        ):
            out = FOTO / f"{slot.name}-{width}.{suffix}"
            resized.save(out, **params)
            written.append(out)

    # Jedan JPEG kao zadnja zamjena. Ne treba ih tri: preglednik koji ne zna
    # ni AVIF ni WebP gotovo sigurno nije na uskoj vezi kojoj bi tri širine
    # nešto značile.
    fallback_w = slot.widths[len(slot.widths) // 2]
    fallback = cover(img, fallback_w, slot.height_for(fallback_w))
    out = FOTO / f"{slot.name}-{fallback_w}.jpg"
    fallback.save(out, quality=JPEG_QUALITY, optimize=True, progressive=True)
    written.append(out)

    total_kb = sum(p.stat().st_size for p in written) // 1024
    mark = "ZAMJENSKA" if is_placeholder else "fotografija"
    print(f"  {slot.name:<16} {mark:<12} {len(written)} datoteka, {total_kb} kB")


    return {
        "widths": slot.widths,
        "width": largest,
        "height": slot.height_for(largest),
        "fallbackWidth": fallback_w,
        "placeholder": is_placeholder,
    }


def write_manifest(entries: dict[str, dict]) -> None:
    """Manifest je TypeScript, ne JSON.

    Tako komponenta dobije provjeru tipa za naziv mjesta (krivi naziv je
    greška pri prevođenju, ne slomljena slika u pregledniku), a dimenzije
    ulaze u bundle bez dodatnog mrežnog zahtjeva.
    """
    lines = [
        "/**",
        " * GENERIRANO — ne uređivati ručno.",
        " *",
        " * Nastaje iz `scripts/build-images.py`, koji čita originale iz",
        " * `public/foto/izvor/`. Dimenzije su stvarne dimenzije izvedenica, pa",
        " * `<Picture>` njima rezervira prostor i raspored ne poskoči.",
        " *",
        " * `placeholder: true` znači da originala nema i da je na tom mjestu",
        " * označena zamjenska ploča.",
        " */",
        "export type PhotoName = keyof typeof photos;",
        "",
        "export const photos = {",
    ]
    for name, data in entries.items():
        lines += [
            f"  '{name}': {{",
            f"    widths: {list(data['widths'])},",
            f"    width: {data['width']},",
            f"    height: {data['height']},",
            f"    fallbackWidth: {data['fallbackWidth']},",
            f"    placeholder: {'true' if data['placeholder'] else 'false'},",
            "  },",
        ]
    lines += ["} as const;", ""]
    MANIFEST.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nmanifest: {MANIFEST.relative_to(ROOT)}")


def main() -> None:
    try:
        from PIL import Image, features
    except ImportError:
        sys.exit("Nedostaje Pillow. Instalirati s: pip install pillow")

    if not features.check("avif"):
        sys.exit(
            "Ovaj Pillow nema podršku za AVIF. Nadograditi s: pip install -U pillow"
        )

    colour = tokens()
    FOTO.mkdir(parents=True, exist_ok=True)
    IZVOR.mkdir(parents=True, exist_ok=True)

    print(f"originali: {IZVOR.relative_to(ROOT)}\n")
    entries = {slot.name: build(slot, colour) for slot in SLOTS}
    write_manifest(entries)

    missing = [name for name, data in entries.items() if data["placeholder"]]
    if missing:
        print(
            f"\nZAMJENSKE PLOČE na {len(missing)} mjesta: {', '.join(missing)}\n"
            f"Zamijeniti tako da se original spremi kao "
            f"{IZVOR.relative_to(ROOT)}/<naziv>.jpg i skripta pokrene ponovno."
        )
    _ = Image  # zadržano radi jasnoće uvoza


if __name__ == "__main__":
    main()
