#!/usr/bin/env python3
"""Generate PWA icons for Mileage Tracker."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

PUBLIC = Path(__file__).resolve().parent.parent / "public"
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
BACKGROUND = "#18181b"  # zinc-900
FOREGROUND = "#ffffff"
TEXT = "MT"


def create_icon(size: int, *, text: str = TEXT, scale: float = 0.5) -> Image.Image:
    img = Image.new("RGB", (size, size), BACKGROUND)
    draw = ImageDraw.Draw(img)

    # Keep the text within the maskable safe zone (80% diameter) by default.
    font_size = int(size * scale)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size)
    except OSError:
        font = ImageFont.load_default()

    # Measure text and center it.
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]

    draw.text((x, y), text, fill=FOREGROUND, font=font)
    return img


def create_favicon() -> Image.Image:
    """Create a small favicon; shrink the text to fit."""
    sizes = [16, 32, 48]
    imgs = []
    for s in sizes:
        img = Image.new("RGB", (s, s), BACKGROUND)
        draw = ImageDraw.Draw(img)
        # Use a font size that fits within the small square.
        font_size = max(6, int(s * 0.45))
        try:
            font = ImageFont.truetype(FONT_PATH, font_size)
        except OSError:
            font = ImageFont.load_default()
        text = "M" if s < 24 else "MT"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (s - text_width) // 2 - bbox[0]
        y = (s - text_height) // 2 - bbox[1]
        draw.text((x, y), text, fill=FOREGROUND, font=font)
        imgs.append(img)
    # ICO with multiple sizes.
    ico = imgs[-1]
    ico.save(PUBLIC / "favicon.ico", sizes=[(im.width, im.height) for im in imgs], format="ICO")
    return ico


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)

    create_icon(192, scale=0.5).save(PUBLIC / "icon-192x192.png", "PNG")
    create_icon(512, scale=0.5).save(PUBLIC / "icon-512x512.png", "PNG")
    create_icon(192, scale=0.45).save(PUBLIC / "maskable-icon-192x192.png", "PNG")
    create_icon(512, scale=0.45).save(PUBLIC / "maskable-icon-512x512.png", "PNG")
    create_icon(180, scale=0.45).save(PUBLIC / "apple-icon.png", "PNG")
    create_favicon()

    print("Generated PWA icons in", PUBLIC)


if __name__ == "__main__":
    main()
