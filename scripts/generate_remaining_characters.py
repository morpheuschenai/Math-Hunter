#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


CANVAS = 640
BASELINE = 476
CENTER_X = 320
TARGET_W = 252
TARGET_H = 274


def new_canvas():
    return Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))


def rounded_line(draw, points, fill, width):
    draw.line(points, fill=fill, width=width)
    radius = width // 2
    for x, y in (points[0], points[-1]):
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def gradient_fill(size, top_color, bottom_color):
    width, height = size
    img = Image.new("RGBA", size)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(1, height - 1)
        r = round(top_color[0] * (1 - t) + bottom_color[0] * t)
        g = round(top_color[1] * (1 - t) + bottom_color[1] * t)
        b = round(top_color[2] * (1 - t) + bottom_color[2] * t)
        draw.line((0, y, width, y), fill=(r, g, b, 255))
    return img


def alpha_bbox(img: Image.Image, threshold=10):
    alpha = img.getchannel("A")
    bw = alpha.point(lambda p: 255 if p > threshold else 0)
    return bw.getbbox()


def add_ground_shadow(base: Image.Image, center_x, y, width, height, alpha=70):
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse(
        (center_x - width // 2, y - height // 2, center_x + width // 2, y + height // 2),
        fill=(48, 37, 33, alpha),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(shadow)


def add_inner_shade(layer: Image.Image, mask: Image.Image, box, color):
    shade = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shade)
    draw.ellipse(box, fill=color)
    shade = shade.filter(ImageFilter.GaussianBlur(24))
    layer.alpha_composite(Image.composite(shade, Image.new("RGBA", layer.size, (0, 0, 0, 0)), mask))


def add_highlight(layer: Image.Image, mask: Image.Image, box, alpha=70):
    glow = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    draw.ellipse(box, fill=(255, 255, 255, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    layer.alpha_composite(Image.composite(glow, Image.new("RGBA", layer.size, (0, 0, 0, 0)), mask))


def compose_surface(mask, top_color, bottom_color, outline=None):
    body = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    body.paste(gradient_fill(mask.size, top_color, bottom_color), (0, 0), mask)
    add_inner_shade(body, mask, (180, 310, 520, 560), (9, 28, 52, 26))
    add_inner_shade(body, mask, (150, 280, 430, 560), (0, 0, 0, 18))
    add_highlight(body, mask, (172, 154, 300, 258), 92)
    add_highlight(body, mask, (234, 178, 360, 294), 42)
    if outline is not None:
        edge = mask.filter(ImageFilter.GaussianBlur(1.2))
        stroke = Image.new("RGBA", mask.size, outline)
        body.alpha_composite(Image.composite(stroke, Image.new("RGBA", mask.size, (0, 0, 0, 0)), edge))
        body.paste(gradient_fill(mask.size, top_color, bottom_color), (0, 0), mask)
    return body


def paste_surface(base, mask, top_color, bottom_color, outline=None):
    base.alpha_composite(compose_surface(mask, top_color, bottom_color, outline))


def mask_from_line(points, width, hand=None):
    mask = Image.new("L", (CANVAS, CANVAS), 0)
    draw = ImageDraw.Draw(mask)
    rounded_line(draw, points, 255, width)
    if hand:
        hx, hy, hr = hand
        draw.ellipse((hx - hr, hy - hr, hx + hr, hy + hr), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(0.6))


def draw_hand_mask(mask_draw, center, style):
    cx, cy = center
    if style == "fist":
        mask_draw.ellipse((cx - 26, cy - 26, cx + 26, cy + 26), fill=255)
    elif style == "chin":
        mask_draw.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill=255)
        rounded_line(mask_draw, [(cx - 2, cy - 3), (cx + 28, cy - 10)], 255, 18)
    elif style == "point":
        mask_draw.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill=255)
        rounded_line(mask_draw, [(cx + 2, cy), (cx + 34, cy - 20)], 255, 14)
    elif style == "wave":
        mask_draw.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill=255)
        rounded_line(mask_draw, [(cx + 2, cy), (cx + 25, cy - 28)], 255, 14)
        rounded_line(mask_draw, [(cx + 8, cy - 6), (cx + 34, cy - 18)], 255, 12)
    else:
        mask_draw.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), fill=255)


def paste_arm(base, anchor, hand_center, width, style, top_color, bottom_color):
    mask = Image.new("L", (CANVAS, CANVAS), 0)
    draw = ImageDraw.Draw(mask)
    rounded_line(draw, [anchor, hand_center], 255, width)
    draw_hand_mask(draw, hand_center, style)
    mask = mask.filter(ImageFilter.GaussianBlur(0.6))
    paste_surface(base, mask, top_color, bottom_color)


def brow(draw, center, angle, length=92, width=20, color=(22, 22, 28, 255)):
    cx, cy = center
    dx = length // 2
    dy = round(angle * 18)
    rounded_line(draw, [(cx - dx, cy - dy), (cx + dx, cy + dy)], color, width)


def eye(draw, box, pupil_offset=(0, 0), lid=0):
    draw.ellipse(box, fill=(255, 255, 255, 255))
    x0, y0, x1, y1 = box
    cx = (x0 + x1) / 2 + pupil_offset[0]
    cy = (y0 + y1) / 2 + pupil_offset[1]
    pr = min(x1 - x0, y1 - y0) * 0.18
    draw.ellipse((cx - pr, cy - pr, cx + pr, cy + pr), fill=(24, 24, 30, 255))
    if lid > 0:
        draw.rounded_rectangle((x0 - 4, y0 - 2, x1 + 4, y0 + lid), radius=10, fill=(255, 255, 255, 255))


def mouth(draw, kind, box, color=(28, 28, 34, 255)):
    x0, y0, x1, y1 = box
    if kind == "smile":
        draw.arc((x0, y0, x1, y1 + 16), start=14, end=168, fill=color, width=8)
    elif kind == "flat":
        rounded_line(draw, [(x0, (y0 + y1) // 2), (x1, (y0 + y1) // 2)], color, 8)
    elif kind == "o":
        draw.ellipse(box, fill=color)
    elif kind == "frown":
        draw.arc((x0, y0 - 6, x1, y1 + 8), start=198, end=342, fill=color, width=8)
    elif kind == "smirk":
        draw.arc((x0, y0 + 6, x1, y1 + 18), start=10, end=150, fill=color, width=7)


def draw_marks(draw, origin, color):
    ox, oy = origin
    rounded_line(draw, [(ox - 24, oy - 10), (ox - 42, oy - 34)], color, 10)
    rounded_line(draw, [(ox, oy - 20), (ox - 2, oy - 50)], color, 10)
    rounded_line(draw, [(ox + 18, oy - 12), (ox + 26, oy - 40)], color, 10)


def normalize_sprite(img: Image.Image, target_w=TARGET_W, target_h=TARGET_H):
    box = alpha_bbox(img, threshold=12)
    if not box:
        return img
    cropped = img.crop(box)
    width = box[2] - box[0]
    height = box[3] - box[1]
    scale = min(target_w / width, target_h / height)
    new_size = (max(1, round(width * scale)), max(1, round(height * scale)))
    resized = cropped.resize(new_size, Image.Resampling.LANCZOS)
    out = new_canvas()
    x = CENTER_X - new_size[0] // 2
    y = BASELINE - new_size[1]
    out.alpha_composite(resized, (x, y))
    return out


def body_mask_ch11():
    mask = Image.new("L", (CANVAS, CANVAS), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((198, 196, 432, 436), fill=255)
    draw.polygon([(292, 196), (304, 155), (325, 185), (334, 196)], fill=255)
    draw.ellipse((284, 174, 336, 224), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(0.8))


def body_mask_ch13():
    mask = Image.new("L", (CANVAS, CANVAS), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((202, 178, 438, 438), radius=42, fill=255)
    draw.polygon([(220, 184), (242, 140), (262, 184)], fill=255)
    draw.polygon([(374, 184), (394, 140), (418, 184)], fill=255)
    return mask.filter(ImageFilter.GaussianBlur(0.8))


def render_ch11(state):
    img = new_canvas()
    mask = body_mask_ch11()
    paste_surface(img, mask, (68, 221, 222), (19, 174, 205))
    add_inner_shade(img, mask, (200, 210, 455, 470), (0, 52, 94, 26))
    draw = ImageDraw.Draw(img)
    arm_top = (59, 205, 214)
    arm_bottom = (22, 166, 199)

    left_anchor = (224, 338)
    right_anchor = (408, 332)
    left_hand = (195, 386)
    right_hand = (452, 336)
    left_style = "round"
    right_style = "point"
    left_width = right_width = 30

    left_eye = (246, 258, 316, 332)
    right_eye = (314, 256, 384, 330)
    left_pupil = (-8, 0)
    right_pupil = (-8, 0)
    lid = 0
    brow_left = brow_right = -0.02
    mouth_kind = "smirk"
    mouth_box = (302, 344, 342, 372)
    marks = False

    if state == "think":
        left_hand = (286, 374)
        left_style = "chin"
        right_hand = (440, 368)
        right_style = "round"
        left_pupil = right_pupil = (10, -10)
        mouth_kind = "flat"
        mouth_box = (301, 346, 341, 372)
    elif state == "happy":
        right_hand = (458, 314)
        right_style = "wave"
        left_pupil = right_pupil = (0, 4)
        brow_left = brow_right = 0.08
        mouth_kind = "smile"
        mouth_box = (288, 340, 354, 378)
    elif state == "attack":
        right_hand = (442, 372)
        right_style = "fist"
        right_width = 38
        left_pupil = (2, 0)
        right_pupil = (-4, 0)
        brow_left = -0.36
        brow_right = 0.36
        mouth_kind = "flat"
        mouth_box = (296, 344, 348, 372)
    elif state == "hurt":
        left_hand = (282, 390)
        right_hand = (362, 390)
        left_style = right_style = "round"
        left_pupil = right_pupil = (0, 10)
        brow_left = 0.34
        brow_right = -0.34
        mouth_kind = "o"
        mouth_box = (298, 342, 342, 392)
    elif state == "miss":
        right_hand = (440, 382)
        right_style = "round"
        left_pupil = (-10, 0)
        right_pupil = (-12, 0)
        lid = 12
        mouth_kind = "flat"
        mouth_box = (300, 350, 340, 374)
    elif state == "surprise":
        left_pupil = right_pupil = (0, 4)
        brow_left = brow_right = 0.12
        mouth_kind = "o"
        mouth_box = (298, 342, 342, 394)
        right_hand = (440, 384)
        right_style = "round"
        marks = True
    elif state == "enraged":
        left_hand = (186, 322)
        right_hand = (456, 322)
        left_style = right_style = "fist"
        left_pupil = right_pupil = (0, 4)
        brow_left = -0.45
        brow_right = 0.45
        mouth_kind = "frown"
        mouth_box = (286, 348, 354, 392)

    paste_arm(img, left_anchor, left_hand, left_width, left_style, arm_top, arm_bottom)
    paste_arm(img, right_anchor, right_hand, right_width, right_style, arm_top, arm_bottom)

    eye(draw, left_eye, left_pupil, lid)
    eye(draw, right_eye, right_pupil, lid)
    brow(draw, (280, 236), brow_left)
    brow(draw, (352, 236), brow_right)
    mouth(draw, mouth_kind, mouth_box)
    if marks:
        draw_marks(draw, (234, 224), (48, 196, 228, 255))
    out = normalize_sprite(img)
    add_ground_shadow(out, 320, 454, 132, 28, 42)
    return out


def render_ch13(state):
    img = new_canvas()
    mask = body_mask_ch13()
    paste_surface(img, mask, (164, 224, 58), (114, 188, 32))
    add_inner_shade(img, mask, (214, 206, 450, 458), (46, 88, 14, 24))
    draw = ImageDraw.Draw(img)
    arm_top = (145, 216, 54)
    arm_bottom = (104, 180, 28)

    left_anchor = (222, 334)
    right_anchor = (418, 328)
    left_hand = (194, 386)
    right_hand = (452, 334)
    left_style = "round"
    right_style = "point"
    left_width = right_width = 30

    left_eye = (250, 254, 320, 326)
    right_eye = (322, 254, 392, 326)
    left_pupil = right_pupil = (0, 0)
    brow_left = brow_right = 0.0
    mouth_kind = "smile"
    mouth_box = (280, 338, 360, 382)
    marks = False
    fang_left = (288, 342, 306, 376)
    fang_right = (334, 342, 352, 376)

    if state == "idle":
        left_pupil = right_pupil = (-6, 0)
    elif state == "think":
        left_hand = (286, 378)
        left_style = "chin"
        right_hand = (440, 366)
        right_style = "round"
        mouth_kind = "flat"
        mouth_box = (300, 348, 340, 374)
        left_pupil = right_pupil = (10, -10)
    elif state == "happy":
        right_hand = (458, 312)
        right_style = "wave"
        left_pupil = right_pupil = (0, 4)
        brow_left = brow_right = 0.08
    elif state == "attack":
        right_hand = (444, 370)
        right_style = "fist"
        right_width = 38
        mouth_kind = "flat"
        mouth_box = (294, 346, 348, 374)
        brow_left = -0.38
        brow_right = 0.38
        left_pupil = (4, 0)
        right_pupil = (-6, 0)
    elif state == "hurt":
        left_hand = (282, 392)
        right_hand = (360, 392)
        left_style = right_style = "round"
        mouth_kind = "o"
        mouth_box = (296, 344, 344, 396)
        brow_left = 0.34
        brow_right = -0.34
        left_pupil = right_pupil = (0, 10)
    elif state == "miss":
        right_hand = (440, 382)
        right_style = "round"
        mouth_kind = "flat"
        mouth_box = (300, 350, 340, 374)
        left_pupil = (-10, 0)
        right_pupil = (-12, 0)
    elif state == "surprise":
        right_hand = (438, 382)
        right_style = "round"
        mouth_kind = "o"
        mouth_box = (296, 344, 344, 396)
        brow_left = brow_right = 0.12
        left_pupil = right_pupil = (0, 4)
        marks = True
    elif state == "enraged":
        left_hand = (186, 320)
        right_hand = (454, 320)
        left_style = right_style = "fist"
        mouth_kind = "frown"
        mouth_box = (282, 350, 358, 394)
        brow_left = -0.45
        brow_right = 0.45
        left_pupil = right_pupil = (0, 4)

    paste_arm(img, left_anchor, left_hand, left_width, left_style, arm_top, arm_bottom)
    paste_arm(img, right_anchor, right_hand, right_width, right_style, arm_top, arm_bottom)

    eye(draw, left_eye, left_pupil)
    eye(draw, right_eye, right_pupil)
    brow(draw, (284, 234), brow_left)
    brow(draw, (358, 234), brow_right)
    mouth(draw, mouth_kind, mouth_box)
    if state not in {"surprise", "enraged"}:
        draw.polygon(
            [(fang_left[0], fang_left[1]), (fang_left[2], fang_left[1]), ((fang_left[0] + fang_left[2]) // 2, fang_left[3])],
            fill=(255, 255, 255, 255),
        )
        draw.polygon(
            [(fang_right[0], fang_right[1]), (fang_right[2], fang_right[1]), ((fang_right[0] + fang_right[2]) // 2, fang_right[3])],
            fill=(255, 255, 255, 255),
        )
    if marks:
        draw_marks(draw, (250, 220), (133, 88, 216, 255))
    out = normalize_sprite(img)
    add_ground_shadow(out, 320, 454, 140, 30, 42)
    return out


def main():
    out = Path("assets/characters")
    out.joinpath("ch11").mkdir(parents=True, exist_ok=True)
    out.joinpath("ch13").mkdir(parents=True, exist_ok=True)
    states = ["idle", "think", "happy", "attack", "hurt", "miss", "surprise", "enraged"]
    for state in states:
        render_ch11(state).save(out / "ch11" / f"{state}.png")
        render_ch13(state).save(out / "ch13" / f"{state}.png")


if __name__ == "__main__":
    main()
