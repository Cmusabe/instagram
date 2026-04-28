#!/usr/bin/env python3

import argparse
import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable, Optional, Tuple

from PIL import Image, ImageChops, ImageColor, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
WEB_ROOT = ROOT.parent
ICONS_DIR = ROOT / "icons"
TEMP_DIR = ICONS_DIR / ".store-gen"
LOGO_PATH = WEB_ROOT / "public" / "logo" / "instaclean-logo.png"
ICON_PATH = ICONS_DIR / "store-icon-128.png"

REPLICATE_BASE = "https://api.replicate.com/v1"
REPLICATE_MODEL = "google/nano-banana-pro"

BG_PROMPTS = {
    "upload": (
        "Premium software launch background for a chrome extension store listing, obsidian black canvas, "
        "large magenta glow blooming from the left edge, electric violet ribbon arcs sweeping across the upper right, "
        "subtle smoked glass texture, cinematic depth, clean center-right negative space for a product mockup, "
        "high-end, editorial, minimal, no text, no logos, no people, no devices, no UI"
    ),
    "progress": (
        "Premium software launch background for a chrome extension progress screen, near-black canvas, "
        "soft emerald accent glow low on the left, deep violet atmospheric waves in the upper right, "
        "sleek motion blur, cinematic depth, elegant tech poster composition with clear negative space, "
        "minimal, refined, dimensional, no text, no logos, no people, no devices, no UI"
    ),
    "panorama": (
        "Ultra wide premium abstract background for a software promo banner, deep charcoal black, "
        "large magenta bloom on the far left, elegant violet light architecture on the far right, "
        "subtle silver streaks through the center, luxe cinematic atmosphere, center kept readable for branding, "
        "no text, no logos, no people, no devices, no UI"
    ),
}

COLORS = {
    "bg": "#08070c",
    "bg2": "#11111b",
    "panel": "#11111d",
    "panel_2": "#141523",
    "panel_soft": "#181928",
    "line": (255, 255, 255, 16),
    "line_strong": (255, 255, 255, 30),
    "muted": "#8a8da3",
    "muted_2": "#a1a5be",
    "white": "#f7f7fb",
    "pink": "#f15bb5",
    "violet": "#8b5cf6",
    "violet_2": "#7c4dff",
    "purple": "#c06eff",
    "success": "#25d29b",
    "success_soft": "#0dbf8c",
    "warning": "#f6b24a",
    "danger": "#ff646f",
    "danger_soft": "#5a2027",
    "chip_bg": "#181929",
}

AVATARS = [
    ("travel_adventures", "#ff5e84"),
    ("photo_daily", "#9c6bff"),
    ("fitness_queen", "#4bb3ff"),
    ("amsterdam_life", "#35d88e"),
    ("music_lover_x", "#f2c94c"),
    ("style_sara", "#d96cff"),
]


def ensure_dirs() -> None:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)


def hex_rgba(value: str, alpha: int = 255) -> Tuple[int, int, int, int]:
    r, g, b = ImageColor.getrgb(value)
    return (r, g, b, alpha)


def load_font(size: int, face: str = "regular") -> ImageFont.FreeTypeFont:
    candidates = []
    if face == "heavy":
        candidates = [
            ("/System/Library/Fonts/Avenir.ttc", 4),
            ("/System/Library/Fonts/HelveticaNeue.ttc", 4),
            ("/System/Library/Fonts/Helvetica.ttc", 1),
        ]
    elif face == "bold":
        candidates = [
            ("/System/Library/Fonts/Avenir Next.ttc", 0),
            ("/System/Library/Fonts/HelveticaNeue.ttc", 1),
            ("/System/Library/Fonts/Helvetica.ttc", 1),
        ]
    elif face == "medium":
        candidates = [
            ("/System/Library/Fonts/Avenir Next.ttc", 5),
            ("/System/Library/Fonts/HelveticaNeue.ttc", 7),
            ("/System/Library/Fonts/SFNS.ttf", 0),
        ]
    elif face == "mono":
        candidates = [
            ("/System/Library/Fonts/SFNSMono.ttf", 0),
            ("/System/Library/Fonts/Menlo.ttc", 0),
            ("/System/Library/Fonts/Monaco.ttf", 0),
        ]
    else:
        candidates = [
            ("/System/Library/Fonts/Avenir Next.ttc", 7),
            ("/System/Library/Fonts/HelveticaNeue.ttc", 0),
            ("/System/Library/Fonts/SFNS.ttf", 0),
        ]

    for path, index in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size=size, index=index)
    return ImageFont.load_default()


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> Tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> Iterable[str]:
    lines = []
    current = ""
    for word in text.split():
        attempt = word if not current else f"{current} {word}"
        if draw.textbbox((0, 0), attempt, font=font)[2] <= max_width:
            current = attempt
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def post_json(url: str, payload: dict, token: str, prefer_wait: Optional[int] = None) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {token}")
    if prefer_wait:
        req.add_header("Prefer", f"wait={prefer_wait}")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_json(url: str, token: str) -> dict:
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download_file(url: str, destination: Path) -> None:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=120) as resp:
        destination.write_bytes(resp.read())


def replicate_generate(token: str, prompt: str, aspect_ratio: str, destination: Path) -> Path:
    if destination.exists():
        return destination

    payload = {
        "input": {
            "prompt": prompt,
            "resolution": "2K",
            "aspect_ratio": aspect_ratio,
            "output_format": "png",
            "safety_filter_level": "block_only_high",
            "allow_fallback_model": False,
        }
    }

    url = f"{REPLICATE_BASE}/models/{REPLICATE_MODEL}/predictions"
    prediction = post_json(url, payload, token, prefer_wait=15)
    get_url = prediction.get("urls", {}).get("get")
    if not get_url:
        raise RuntimeError(f"Replicate did not return a poll URL: {prediction}")

    deadline = time.time() + 900
    status = prediction.get("status")
    while status not in {"succeeded", "failed", "canceled"}:
        if time.time() > deadline:
            raise TimeoutError(f"Timed out waiting for Replicate prediction {prediction.get('id')}")
        time.sleep(5)
        prediction = get_json(get_url, token)
        status = prediction.get("status")

    if status != "succeeded":
        raise RuntimeError(f"Replicate generation failed: {prediction.get('error') or status}")

    output_url = prediction.get("output")
    if isinstance(output_url, list):
        output_url = output_url[0]
    if not output_url:
        raise RuntimeError("Replicate generation succeeded without an output URL")

    download_file(output_url, destination)
    return destination


def fallback_background(size: Tuple[int, int], mode: str) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, hex_rgba(COLORS["bg"]))
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    if mode == "panorama":
        centers = [(-int(w * 0.1), int(h * 0.45), "#f15bb5"), (int(w * 0.95), int(h * 0.42), "#7c4dff")]
    else:
        centers = [(int(w * 0.12), int(h * 0.18), "#f15bb5"), (int(w * 0.82), int(h * 0.78), "#7c4dff")]

    for cx, cy, color in centers:
        for radius, alpha in [
            (int(min(w, h) * 0.55), 24),
            (int(min(w, h) * 0.42), 34),
            (int(min(w, h) * 0.26), 44),
        ]:
            draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=hex_rgba(color, alpha))

    layer = layer.filter(ImageFilter.GaussianBlur(70))
    img = Image.alpha_composite(img, layer)
    return img


def load_background(path: Path, size: Tuple[int, int], mode: str) -> Image.Image:
    if path.exists():
        base = Image.open(path).convert("RGBA")
        bleed = 0.035 if mode == "wide" else 0.02
        left = int(base.width * bleed)
        top = int(base.height * bleed)
        right = base.width - left
        bottom = base.height - top
        if right - left > 200 and bottom - top > 200:
            base = base.crop((left, top, right, bottom))
        return ImageOps.fit(base, size, method=Image.Resampling.LANCZOS)
    return fallback_background(size, mode)


def add_noise(image: Image.Image, strength: int = 20) -> Image.Image:
    noise = Image.effect_noise(image.size, 20).convert("L")
    noise = ImageOps.autocontrast(noise)
    noise = noise.point(lambda v: int(v * strength / 255))
    alpha = Image.new("L", image.size, 22)
    grain = Image.merge("RGBA", (noise, noise, noise, alpha))
    return Image.alpha_composite(image, grain)


def overlay_vignette(image: Image.Image, alpha: int = 140) -> Image.Image:
    w, h = image.size
    vignette = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(vignette)
    d.ellipse((-w * 0.12, -h * 0.18, w * 1.12, h * 1.18), fill=255)
    vignette = ImageOps.invert(vignette).filter(ImageFilter.GaussianBlur(120))
    shade = Image.new("RGBA", (w, h), (0, 0, 0, alpha))
    shade.putalpha(vignette)
    return Image.alpha_composite(image, shade)


def shade_edges(image: Image.Image, top: int = 40, bottom: int = 40, alpha: int = 125) -> Image.Image:
    w, h = image.size
    shade = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shade)
    draw.rectangle((0, 0, w, top), fill=(5, 6, 10, alpha))
    draw.rectangle((0, h - bottom, w, h), fill=(5, 6, 10, alpha))
    draw.rectangle((0, 0, w, max(12, top // 2)), fill=(5, 6, 10, min(255, alpha + 55)))
    draw.rectangle((0, h - max(12, bottom // 2), w, h), fill=(5, 6, 10, min(255, alpha + 55)))
    shade = shade.filter(ImageFilter.GaussianBlur(22))
    return Image.alpha_composite(image, shade)


def hard_frame(image: Image.Image, top: int = 20, bottom: int = 20, color: Tuple[int, int, int, int] = (6, 7, 12, 255)) -> None:
    draw = ImageDraw.Draw(image)
    w, h = image.size
    draw.rectangle((0, 0, w, top), fill=color)
    draw.rectangle((0, h - bottom, w, h), fill=color)


def draw_gradient_rect(image: Image.Image, box: Tuple[int, int, int, int], start: str, end: str, radius: int) -> None:
    x1, y1, x2, y2 = box
    w = max(1, x2 - x1)
    h = max(1, y2 - y1)
    grad = Image.new("RGBA", (w, h), 0)
    sr, sg, sb = ImageColor.getrgb(start)
    er, eg, eb = ImageColor.getrgb(end)
    px = grad.load()
    for x in range(w):
        t = x / max(1, w - 1)
        r = int(sr + (er - sr) * t)
        g = int(sg + (eg - sg) * t)
        b = int(sb + (eb - sb) * t)
        for y in range(h):
            px[x, y] = (r, g, b, 255)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    grad.putalpha(mask)
    image.alpha_composite(grad, (x1, y1))


def paste_with_shadow(base: Image.Image, overlay: Image.Image, xy: Tuple[int, int], shadow_alpha: int = 110, blur: int = 28, expand: int = 26) -> None:
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    alpha = overlay.getchannel("A")
    box = (xy[0] - expand, xy[1] - expand, xy[0] + overlay.width + expand, xy[1] + overlay.height + expand)
    shadow_mask = Image.new("L", (box[2] - box[0], box[3] - box[1]), 0)
    ImageDraw.Draw(shadow_mask).rounded_rectangle((expand, expand, shadow_mask.width - expand, shadow_mask.height - expand), radius=36, fill=shadow_alpha)
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(blur))
    shadow_tile = Image.new("RGBA", shadow_mask.size, (0, 0, 0, 255))
    shadow_tile.putalpha(shadow_mask)
    shadow.alpha_composite(shadow_tile, (box[0], box[1]))
    base.alpha_composite(shadow)
    base.alpha_composite(overlay, xy)


def pill(draw: ImageDraw.ImageDraw, box: Tuple[int, int, int, int], text: str, bg: Tuple[int, int, int, int], fg: str, font: ImageFont.FreeTypeFont, outline: Optional[Tuple[int, int, int, int]] = None) -> None:
    draw.rounded_rectangle(box, radius=(box[3] - box[1]) // 2, fill=bg, outline=outline)
    tw, th = text_size(draw, text, font)
    x = box[0] + (box[2] - box[0] - tw) / 2
    y = box[1] + (box[3] - box[1] - th) / 2 - 2
    draw.text((x, y), text, font=font, fill=fg)


def feature_card(
    base: Image.Image,
    box: Tuple[int, int, int, int],
    eyebrow: str,
    title: str,
    body: str,
    accent: str,
) -> None:
    x1, y1, x2, y2 = box
    panel = Image.new("RGBA", (x2 - x1, y2 - y1), (0, 0, 0, 0))
    draw = ImageDraw.Draw(panel)
    draw.rounded_rectangle((0, 0, panel.width - 1, panel.height - 1), radius=24, fill=(18, 18, 28, 214), outline=(255, 255, 255, 20))
    draw.rounded_rectangle((18, 18, 112, 44), radius=13, fill=hex_rgba(accent, 34))
    draw.text((32, 24), eyebrow, font=load_font(14, "bold"), fill=COLORS["white"])
    draw.text((22, 64), title, font=load_font(24, "bold"), fill=COLORS["white"])
    body_lines = list(wrap_text(draw, body, load_font(17, "regular"), panel.width - 44))
    yy = 98
    for line in body_lines[:2]:
        draw.text((22, yy), line, font=load_font(17, "regular"), fill=(255, 255, 255, 144))
        yy += 24
    base.alpha_composite(panel, (x1, y1))


def draw_logo(target: Image.Image, box: Tuple[int, int, int, int], opacity: float = 1.0) -> None:
    if not LOGO_PATH.exists():
        return
    logo = Image.open(LOGO_PATH).convert("RGBA")
    fitted = ImageOps.contain(logo, (box[2] - box[0], box[3] - box[1]), method=Image.Resampling.LANCZOS)
    if opacity < 1.0:
        alpha = fitted.getchannel("A").point(lambda v: int(v * opacity))
        fitted.putalpha(alpha)
    target.alpha_composite(fitted, (box[0], box[1]))


def draw_icon(target: Image.Image, box: Tuple[int, int, int, int], opacity: float = 1.0) -> None:
    if not ICON_PATH.exists():
        return
    icon = Image.open(ICON_PATH).convert("RGBA")
    fitted = ImageOps.contain(icon, (box[2] - box[0], box[3] - box[1]), method=Image.Resampling.LANCZOS)
    if opacity < 1.0:
        alpha = fitted.getchannel("A").point(lambda v: int(v * opacity))
        fitted.putalpha(alpha)
    target.alpha_composite(fitted, (box[0], box[1]))


def rounded_panel(size: Tuple[int, int], radius: int = 28, fill=(17, 17, 29, 230), outline=(255, 255, 255, 24)) -> Image.Image:
    panel = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(panel)
    draw.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=fill, outline=outline, width=1)
    return panel


def draw_browser_window(size: Tuple[int, int], progress: bool = False) -> Image.Image:
    w, h = size
    panel = rounded_panel(size, radius=34, fill=(16, 17, 27, 235), outline=(255, 255, 255, 18))
    draw = ImageDraw.Draw(panel)

    font_small = load_font(15, "medium")
    font_mono = load_font(18, "mono")
    font_row = load_font(20, "medium")
    font_badge = load_font(16, "bold")

    draw.rounded_rectangle((0, 0, w, 58), radius=34, fill=(255, 255, 255, 10))
    draw.rounded_rectangle((0, 28, w, 58), radius=0, fill=(255, 255, 255, 10))

    circles = ["#ff5f57", "#febc2e", "#28c840"]
    cx = 28
    for color in circles:
        draw.ellipse((cx, 20, cx + 12, 32), fill=color)
        cx += 20

    draw.rounded_rectangle((120, 14, w - 120, 40), radius=14, fill=(255, 255, 255, 12), outline=(255, 255, 255, 16))
    draw_icon(panel, (132, 18, 152, 38), 0.85)
    draw.text((160, 18), "instagram.com/pending", font=font_mono, fill=(255, 255, 255, 82))

    y = 86
    row_h = 56
    for i, (username, color) in enumerate(AVATARS[:4]):
        row_box = (24, y, w - 24, y + row_h)
        fill = (255, 255, 255, 16 if not progress or i > 3 else 10)
        draw.rounded_rectangle(row_box, radius=22, fill=fill, outline=(255, 255, 255, 14))

        avatar_box = (42, y + 8, 82, y + 48)
        draw.ellipse(avatar_box, fill=color)
        draw.text((avatar_box[0] + 13, avatar_box[1] + 7), username[0].upper(), font=font_badge, fill=COLORS["white"])

        draw.text((100, y + 12), f"@{username}", font=font_row, fill=(255, 255, 255, 215))
        draw.text((100, y + 34), "Private account", font=font_small, fill=(255, 255, 255, 112))

        if progress and i < 4:
            pill(draw, (w - 160, y + 13, w - 46, y + 43), "Cancelled", hex_rgba(COLORS["success"], 36), COLORS["success"], font_badge)
        else:
            pill(draw, (w - 154, y + 13, w - 46, y + 43), "Requested", (255, 255, 255, 18), "#d0d2e4", font_badge)
        y += row_h + 10

    footer_y = h - 68
    if not progress:
        pill(draw, (28, footer_y, 198, footer_y + 34), "6 requests loaded", hex_rgba(COLORS["violet"], 26), COLORS["white"], load_font(16, "bold"))
        draw.text((214, footer_y + 7), "Ready to start", font=load_font(16, "medium"), fill=(255, 255, 255, 126))
    else:
        pill(draw, (28, footer_y, 188, footer_y + 34), "4 of 6 cancelled", hex_rgba(COLORS["success"], 26), COLORS["success"], load_font(16, "bold"))
        draw.text((204, footer_y + 7), "2 remaining", font=load_font(16, "medium"), fill=(255, 255, 255, 126))

    return panel


def draw_popup(size: Tuple[int, int], mode: str) -> Image.Image:
    w, h = size
    panel = rounded_panel(size, radius=32, fill=(17, 18, 29, 244), outline=(255, 255, 255, 20))
    draw = ImageDraw.Draw(panel)

    font_logo = load_font(28, "bold")
    font_regular = load_font(19, "regular")
    font_medium = load_font(18, "medium")
    font_small = load_font(14, "regular")
    font_badge = load_font(14, "bold")
    font_tiny = load_font(12, "medium")

    draw.text((26, 24), "Insta", font=font_logo, fill=COLORS["white"])
    draw.text((89, 24), "Clean", font=font_logo, fill=COLORS["purple"])
    draw.text((w - 64, 30), "v1.1", font=font_tiny, fill=(255, 255, 255, 80))
    draw.line((0, 72, w, 72), fill=(255, 255, 255, 16), width=1)

    if mode == "upload":
        draw_gradient_rect(panel, (26, 92, 228, 128), COLORS["violet"], COLORS["purple"], 12)
        draw.rounded_rectangle((236, 92, w - 26, 128), radius=12, fill=(255, 255, 255, 8), outline=(255, 255, 255, 14))
        draw.text((68, 99), "Upload file", font=font_medium, fill=COLORS["white"])
        draw.text((271, 99), "Enter manually", font=font_medium, fill=(255, 255, 255, 96))

        draw.rounded_rectangle((26, 152, w - 26, 300), radius=20, fill=(255, 255, 255, 8), outline=(255, 255, 255, 18), width=2)
        draw.text((w / 2 - 8, 204), "▢", font=load_font(34, "regular"), fill=COLORS["white"])
        draw.text((w / 2 - 102, 245), "Drag your Instagram export here", font=font_medium, fill=(255, 255, 255, 165))
        draw.text((w / 2 - 84, 272), "HTML, JSON or TXT", font=font_small, fill=(255, 255, 255, 95))

        draw.text((44, 332), "Instagram settings -> Download your information", font=font_tiny, fill=(255, 255, 255, 82))
        draw.text((26, 380), "SPEED", font=font_tiny, fill=(255, 255, 255, 75))

        presets = [
            ("Safe", "Slow, minimal risk", False),
            ("Balanced", "Recommended", True),
            ("Fast", "Faster, more risk", False),
        ]
        py = 400
        for label, desc, active in presets:
            if active:
                draw.rounded_rectangle((26, py, w - 26, py + 44), radius=14, fill=hex_rgba(COLORS["violet"], 26), outline=hex_rgba(COLORS["purple"], 150), width=2)
                fg = COLORS["white"]
            else:
                draw.rounded_rectangle((26, py, w - 26, py + 44), radius=14, fill=(255, 255, 255, 8), outline=(255, 255, 255, 14))
                fg = (255, 255, 255, 165)
            draw.text((44, py + 11), label, font=font_medium, fill=fg)
            dw, _ = text_size(draw, desc, font_small)
            draw.text((w - 44 - dw, py + 13), desc, font=font_small, fill=(255, 255, 255, 92))
            py += 58

        draw_gradient_rect(panel, (26, h - 72, w - 26, h - 18), COLORS["violet"], COLORS["purple"], 16)
        draw.text((w / 2 - 83, h - 58), "Start cancelling", font=font_medium, fill=COLORS["white"])

    else:
        draw.ellipse((28, 94, 40, 106), fill=COLORS["success"])
        draw.text((54, 89), "Cancelling...", font=font_logo, fill=COLORS["white"])
        draw.text((w - 96, 92), "~2 min", font=font_small, fill=(255, 255, 255, 100))
        draw.rounded_rectangle((26, 132, w - 26, 148), radius=8, fill=(255, 255, 255, 14))
        draw_gradient_rect(panel, (26, 132, 314, 148), COLORS["violet"], COLORS["purple"], 8)
        draw.text((26, 162), "4 / 6", font=font_medium, fill=(255, 255, 255, 170))
        pct = "67%"
        pw, _ = text_size(draw, pct, font_medium)
        draw.text((w - 26 - pw, 162), pct, font=font_medium, fill=(255, 255, 255, 140))

        stats = [
            ("4", "CANCELLED", COLORS["success"]),
            ("0", "SKIPPED", "#9ea1b6"),
            ("0", "FAILED", COLORS["danger"]),
        ]
        sx = 26
        sw = (w - 26 * 2 - 16) // 3
        for value, label, color in stats:
            draw.rounded_rectangle((sx, 206, sx + sw, 284), radius=16, fill=(255, 255, 255, 7), outline=(255, 255, 255, 12))
            vw, _ = text_size(draw, value, load_font(28, "heavy"))
            draw.text((sx + (sw - vw) / 2, 222), value, font=load_font(28, "heavy"), fill=color)
            lw, _ = text_size(draw, label, font_tiny)
            draw.text((sx + (sw - lw) / 2, 255), label, font=font_tiny, fill=(255, 255, 255, 75))
            sx += sw + 8

        log_box = (26, 304, w - 26, 472)
        draw.rounded_rectangle(log_box, radius=18, fill=(8, 8, 14, 168), outline=(255, 255, 255, 12))
        log_entries = [
            ("travel_adventures", COLORS["success"]),
            ("photo_daily", COLORS["success"]),
            ("fitness_queen", COLORS["success"]),
            ("amsterdam_life", COLORS["success"]),
            ("music_lover_x...", (255, 255, 255, 80)),
        ]
        ly = 326
        mono = load_font(18, "mono")
        for username, color in log_entries:
            draw.text((42, ly), "▣", font=font_tiny, fill=color)
            draw.text((60, ly - 2), username, font=mono, fill=color)
            ly += 33

        draw.rounded_rectangle((26, h - 74, 214, h - 18), radius=16, fill=(255, 255, 255, 8), outline=(255, 255, 255, 18))
        draw.text((92, h - 58), "Pause", font=font_medium, fill=(255, 255, 255, 172))
        draw.rounded_rectangle((226, h - 74, w - 26, h - 18), radius=16, fill=(92, 20, 26, 60), outline=hex_rgba(COLORS["danger"], 120))
        draw.text((w - 118, h - 58), "Stop", font=font_medium, fill=COLORS["danger"])

    return panel


def add_soft_glow(base: Image.Image, center: Tuple[int, int], color: str, radius: int, alpha: int) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=hex_rgba(color, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(radius // 2))
    base.alpha_composite(layer)


def screenshot_base(size: Tuple[int, int], background: Image.Image) -> Image.Image:
    base = background.convert("RGBA")
    base = add_noise(base, strength=18)
    base = overlay_vignette(base, alpha=120)
    base = shade_edges(base, top=14, bottom=14, alpha=70)
    shade = Image.new("RGBA", size, (7, 7, 12, 82))
    base = Image.alpha_composite(base, shade)
    return base


def render_screenshot_1(bg_path: Path, out_path: Path) -> None:
    size = (1280, 800)
    base = screenshot_base(size, load_background(bg_path, size, "upload"))
    draw = ImageDraw.Draw(base)

    add_soft_glow(base, (120, 130), COLORS["pink"], 260, 46)
    add_soft_glow(base, (1084, 112), COLORS["violet"], 260, 40)

    draw_logo(base, (72, 44, 320, 136))
    pill(draw, (76, 148, 248, 186), "Upload view", hex_rgba(COLORS["pink"], 34), COLORS["white"], load_font(18, "bold"))

    headline = "Import usernames\nfrom your export."
    font_head = load_font(62, "heavy")
    y = 220
    for line in headline.splitlines():
        draw.text((74, y), line, font=font_head, fill=COLORS["white"])
        y += 70

    sub = "Drop the Instagram HTML, JSON, or TXT export. Pick a speed preset and start the cleanup."
    sub_font = load_font(22, "regular")
    sy = 370
    for line in wrap_text(draw, sub, sub_font, 510):
        draw.text((76, sy), line, font=sub_font, fill=(255, 255, 255, 148))
        sy += 30

    feature_card(base, (74, 470, 302, 610), "FILES", "HTML, JSON, TXT", "Import the export exactly how Instagram gives it to you.", COLORS["pink"])
    feature_card(base, (318, 470, 546, 610), "PRESET", "Safe or balanced", "Use slower safe pacing or the faster recommended mode.", COLORS["violet"])

    browser = draw_browser_window((610, 420), progress=False).resize((458, 318), Image.Resampling.LANCZOS)
    popup = draw_popup((448, 720), mode="upload")
    paste_with_shadow(base, browser, (84, 614), shadow_alpha=90, blur=28)
    paste_with_shadow(base, popup, (770, 52), shadow_alpha=150, blur=36)

    base.save(out_path)


def render_screenshot_2(bg_path: Path, out_path: Path) -> None:
    size = (1280, 800)
    base = screenshot_base(size, load_background(bg_path, size, "progress"))
    overlay = Image.new("RGBA", size, (4, 12, 10, 18))
    base = Image.alpha_composite(base, overlay)
    add_soft_glow(base, (1084, 112), COLORS["violet"], 260, 42)
    add_soft_glow(base, (206, 654), COLORS["success"], 260, 30)
    draw = ImageDraw.Draw(base)

    draw_logo(base, (72, 44, 320, 136))
    pill(draw, (76, 148, 262, 186), "Progress view", (255, 255, 255, 12), COLORS["success"], load_font(18, "bold"), outline=hex_rgba(COLORS["success"], 72))

    headline = "Verify every\nrequest live."
    font_head = load_font(62, "heavy")
    y = 220
    for line in headline.splitlines():
        draw.text((74, y), line, font=font_head, fill=COLORS["white"])
        y += 70

    sub = "See actual progress, read per-account results, and pause or stop whenever you need."
    sub_font = load_font(22, "regular")
    sy = 370
    for line in wrap_text(draw, sub, sub_font, 510):
        draw.text((76, sy), line, font=sub_font, fill=(255, 255, 255, 148))
        sy += 30

    feature_card(base, (74, 470, 302, 610), "LOG", "Per-account results", "Successes, skips, and failures stay visible while the run continues.", COLORS["success"])
    feature_card(base, (318, 470, 546, 610), "CONTROL", "Pause or stop", "Resume after a pause without losing the current session state.", COLORS["violet"])

    browser = draw_browser_window((610, 420), progress=True).resize((458, 318), Image.Resampling.LANCZOS)
    popup = draw_popup((448, 720), mode="progress")
    paste_with_shadow(base, browser, (96, 614), shadow_alpha=90, blur=28)
    paste_with_shadow(base, popup, (770, 52), shadow_alpha=150, blur=36)

    base.save(out_path)


def render_promo_small(bg_path: Path, out_path: Path) -> None:
    size = (440, 280)
    base = load_background(bg_path, size, "progress")
    base = add_noise(base, strength=16)
    base = overlay_vignette(base, alpha=122)
    base = shade_edges(base, top=10, bottom=10, alpha=70)
    dark = Image.new("RGBA", size, (8, 8, 14, 110))
    base = Image.alpha_composite(base, dark)
    add_soft_glow(base, (76, 48), COLORS["pink"], 94, 52)
    add_soft_glow(base, (364, 186), COLORS["violet"], 118, 58)
    draw = ImageDraw.Draw(base)

    draw_icon(base, (24, 20, 82, 78), 0.88)
    draw_logo(base, (86, 26, 238, 74), 0.9)

    title_font = load_font(31, "heavy")
    draw.text((24, 104), "Cancel pending", font=title_font, fill=COLORS["white"])
    draw.text((24, 138), "follow requests", font=title_font, fill=COLORS["white"])
    draw.text((26, 188), "Chrome extension  •  100% local", font=load_font(15, "medium"), fill=(255, 255, 255, 144))

    mini = draw_popup((448, 720), mode="progress")
    mini = mini.resize((150, 240), Image.Resampling.LANCZOS)
    paste_with_shadow(base, mini, (274, 22), shadow_alpha=116, blur=24, expand=18)
    base.save(out_path)


def render_promo_marquee(bg_path: Path, out_path: Path) -> None:
    size = (1400, 560)
    base = load_background(bg_path, size, "panorama")
    base = add_noise(base, strength=18)
    base = overlay_vignette(base, alpha=126)
    base = shade_edges(base, top=24, bottom=24, alpha=120)
    dark = Image.new("RGBA", size, (8, 8, 14, 106))
    base = Image.alpha_composite(base, dark)
    add_soft_glow(base, (170, 142), COLORS["pink"], 180, 44)
    add_soft_glow(base, (1230, 184), COLORS["violet"], 200, 48)
    draw = ImageDraw.Draw(base)

    draw_icon(base, (88, 72, 180, 164))
    draw_logo(base, (194, 84, 548, 178))

    head_font = load_font(58, "heavy")
    draw.text((96, 214), "Run your Instagram", font=head_font, fill=COLORS["white"])
    draw.text((96, 278), "request cleanup faster.", font=head_font, fill=COLORS["white"])
    draw.text((98, 360), "Import usernames, choose a safe preset, and verify every result live.", font=load_font(26, "regular"), fill=(255, 255, 255, 154))

    chip_font = load_font(18, "bold")
    pill(draw, (98, 416, 224, 452), "100% local", hex_rgba(COLORS["violet"], 24), COLORS["white"], chip_font)
    pill(draw, (238, 416, 390, 452), "Import export", (255, 255, 255, 12), "#d6d8e9", chip_font, outline=(255, 255, 255, 22))
    pill(draw, (404, 416, 556, 452), "Live progress", (255, 255, 255, 12), COLORS["success"], chip_font, outline=hex_rgba(COLORS["success"], 72))

    browser = draw_browser_window((520, 360), progress=True).resize((420, 290), Image.Resampling.LANCZOS)
    popup = draw_popup((420, 700), mode="progress").resize((340, 566), Image.Resampling.LANCZOS)
    paste_with_shadow(base, browser, (864, 168), shadow_alpha=100, blur=24)
    paste_with_shadow(base, popup, (1012, 24), shadow_alpha=126, blur=28)
    base.save(out_path)


def save_resized_copy(source: Path, destination: Path, size: Tuple[int, int]) -> None:
    img = Image.open(source).convert("RGBA")
    img = img.resize(size, Image.Resampling.LANCZOS)
    img.save(destination)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Chrome Web Store promo assets for InstaClean.")
    parser.add_argument("--skip-replicate", action="store_true", help="Do not call Replicate; use fallback backgrounds only.")
    args = parser.parse_args()

    ensure_dirs()

    token = os.environ.get("REPLICATE_API_TOKEN", "").strip()
    bg_upload_path = TEMP_DIR / "bg-upload.png"
    bg_progress_path = TEMP_DIR / "bg-progress.png"
    bg_panorama_path = TEMP_DIR / "bg-panorama.png"

    if not args.skip_replicate:
        if not token:
            print("REPLICATE_API_TOKEN is not set; falling back to local backgrounds.", file=sys.stderr)
        else:
            try:
                print("Generating upload background with Nano Banana Pro...")
                replicate_generate(token, BG_PROMPTS["upload"], "16:9", bg_upload_path)
                print("Generating progress background with Nano Banana Pro...")
                replicate_generate(token, BG_PROMPTS["progress"], "16:9", bg_progress_path)
                print("Generating panorama background with Nano Banana Pro...")
                replicate_generate(token, BG_PROMPTS["panorama"], "21:9", bg_panorama_path)
            except (urllib.error.URLError, urllib.error.HTTPError, RuntimeError, TimeoutError) as exc:
                print(f"Replicate generation failed, using fallback backgrounds instead: {exc}", file=sys.stderr)

    render_screenshot_1(bg_upload_path, ICONS_DIR / "screenshot-1.png")
    render_screenshot_2(bg_progress_path, ICONS_DIR / "screenshot-2.png")
    render_promo_small(bg_progress_path, ICONS_DIR / "promo-small-440x280.png")
    render_promo_marquee(bg_panorama_path, ICONS_DIR / "promo-marquee-1400x560.png")
    save_resized_copy(ICONS_DIR / "screenshot-1.png", ICONS_DIR / "screenshot-1-640x400.png", (640, 400))
    save_resized_copy(ICONS_DIR / "screenshot-2.png", ICONS_DIR / "screenshot-2-640x400.png", (640, 400))
    print("Saved assets to:")
    for path in [
        ICONS_DIR / "screenshot-1.png",
        ICONS_DIR / "screenshot-2.png",
        ICONS_DIR / "screenshot-1-640x400.png",
        ICONS_DIR / "screenshot-2-640x400.png",
        ICONS_DIR / "promo-small-440x280.png",
        ICONS_DIR / "promo-marquee-1400x560.png",
    ]:
        print(path)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
