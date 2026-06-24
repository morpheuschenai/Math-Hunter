#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


def sample_border_key(im: Image.Image):
    im = im.convert("RGBA")
    w, h = im.size
    coords = []
    for x in range(w):
        coords.append((x, 0))
        coords.append((x, h - 1))
    for y in range(1, h - 1):
        coords.append((0, y))
        coords.append((w - 1, y))

    bins = {}
    px = im.load()
    for x, y in coords:
        r, g, b, a = px[x, y]
        if a < 10:
            continue
        key = (round(r / 8) * 8, round(g / 8) * 8, round(b / 8) * 8)
        bins[key] = bins.get(key, 0) + 1

    if not bins:
        return None
    return max(bins.items(), key=lambda item: item[1])[0]


def color_distance(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def remove_green(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    key = sample_border_key(im)
    key_is_green = False
    if key is not None:
        kr, kg, kb = key
        key_is_green = kg > 95 and kg - max(kr, kb) > 34 and kg > kr * 1.18 and kg > kb * 1.18
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            delta = g - max(r, b)
            is_green = key_is_green and g > 95 and delta > 34 and g > r * 1.18 and g > b * 1.18
            is_key = False
            if key is not None and a > 0:
                dist = color_distance((r, g, b), key)
                channel_max = max(abs(r - key[0]), abs(g - key[1]), abs(b - key[2]))
                is_key = dist <= 72 and channel_max <= 32

            if is_green or is_key:
                strength = max(delta, 60) if is_green else max(0, 72 - color_distance((r, g, b), key))
                alpha = 0 if strength >= 70 else max(0, min(255, int((34 - strength) * 12)))
                nr = int(r * 0.96)
                ng = int(g * 0.96)
                nb = int(b * 0.96)
                px[x, y] = (nr, ng, nb, alpha)
    alpha = im.getchannel("A").filter(ImageFilter.MedianFilter(size=3))
    im.putalpha(alpha)
    return im


def alpha_bbox(im: Image.Image, threshold: int = 8):
    alpha = im.getchannel("A")
    return alpha.point(lambda v: 255 if v > threshold else 0).getbbox()


def connected_components(im: Image.Image, threshold: int = 8):
    alpha = im.getchannel("A")
    w, h = im.size
    data = alpha.load()
    seen = [[False] * w for _ in range(h)]
    components = []

    for y in range(h):
        for x in range(w):
            if seen[y][x] or data[x, y] <= threshold:
                continue
            queue = deque([(x, y)])
            seen[y][x] = True
            pts = []
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                cx, cy = queue.popleft()
                pts.append((cx, cy))
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and data[nx, ny] > threshold:
                        seen[ny][nx] = True
                        queue.append((nx, ny))
            components.append(
                {
                    "area": len(pts),
                    "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                    "pts": pts,
                }
            )
    components.sort(key=lambda item: item["area"], reverse=True)
    return components


def component_preview(components, limit: int = 4):
    return [{"area": comp["area"], "bbox": comp["bbox"]} for comp in components[:limit]]


def crop_alpha(im: Image.Image) -> Image.Image:
    bbox = alpha_bbox(im)
    return im.crop(bbox) if bbox else im


def crop_with_spill(sheet: Image.Image, col: int, row: int, cell_w: int, cell_h: int, cols: int, rows: int, spill: int):
    left = max(0, col * cell_w - spill)
    top = max(0, row * cell_h - spill)
    right = min(sheet.width, (col + 1) * cell_w + spill)
    bottom = min(sheet.height, (row + 1) * cell_h + spill)
    crop = sheet.crop((left, top, right, bottom))
    target_rect = (
        col * cell_w - left,
        row * cell_h - top,
        (col + 1) * cell_w - left,
        (row + 1) * cell_h - top,
    )
    return crop, target_rect


def intersection_area(a, b):
    left = max(a[0], b[0])
    top = max(a[1], b[1])
    right = min(a[2], b[2])
    bottom = min(a[3], b[3])
    if right <= left or bottom <= top:
        return 0
    return (right - left) * (bottom - top)


def recover_main_subject(expanded: Image.Image, target_rect, threshold: int = 8) -> Image.Image:
    comps = connected_components(expanded, threshold=threshold)
    if not comps:
        return expanded

    tx0, ty0, tx1, ty1 = target_rect
    inset_x = max(18, int((tx1 - tx0) * 0.12))
    inset_y = max(18, int((ty1 - ty0) * 0.12))
    core_rect = (tx0 + inset_x, ty0 + inset_y, tx1 - inset_x, ty1 - inset_y)
    target_cx = (tx0 + tx1) / 2
    target_cy = (ty0 + ty1) / 2

    scored = []
    for comp in comps:
        overlap = intersection_area(comp["bbox"], core_rect)
        cx = (comp["bbox"][0] + comp["bbox"][2]) / 2
        cy = (comp["bbox"][1] + comp["bbox"][3]) / 2
        dist = abs(cx - target_cx) + abs(cy - target_cy)
        scored.append((overlap, -comp["area"], dist, comp))
    scored.sort(key=lambda item: (-item[0], item[1], item[2]))
    main = scored[0][3]

    ml, mt, mr, mb = main["bbox"]
    mw = mr - ml
    mh = mb - mt
    keep = [main]
    for comp in comps:
        if comp is main:
            continue
        cl, ct, cr, cb = comp["bbox"]
        overlap = intersection_area(comp["bbox"], core_rect)
        if overlap > 0:
            keep.append(comp)
            continue
        near_head_signal = (
            cr <= ml + mw * 0.35
            and ct <= mt + mh * 0.45
            and comp["area"] <= main["area"] * 0.05
        )
        if near_head_signal:
            keep.append(comp)

    out = Image.new("RGBA", expanded.size, (0, 0, 0, 0))
    src_px = expanded.load()
    dst_px = out.load()
    for comp in keep:
        for x, y in comp["pts"]:
            dst_px[x, y] = src_px[x, y]
    return crop_alpha(out)


def recover_subject_in_target(expanded: Image.Image, target_rect, threshold: int = 8) -> Image.Image:
    comps = connected_components(expanded, threshold=threshold)
    if not comps:
        tx0, ty0, tx1, ty1 = target_rect
        return Image.new("RGBA", (tx1 - tx0, ty1 - ty0), (0, 0, 0, 0))

    tx0, ty0, tx1, ty1 = target_rect
    inset_x = max(18, int((tx1 - tx0) * 0.12))
    inset_y = max(18, int((ty1 - ty0) * 0.12))
    core_rect = (tx0 + inset_x, ty0 + inset_y, tx1 - inset_x, ty1 - inset_y)
    target_cx = (tx0 + tx1) / 2
    target_cy = (ty0 + ty1) / 2

    scored = []
    for comp in comps:
        overlap = intersection_area(comp["bbox"], core_rect)
        cx = (comp["bbox"][0] + comp["bbox"][2]) / 2
        cy = (comp["bbox"][1] + comp["bbox"][3]) / 2
        dist = abs(cx - target_cx) + abs(cy - target_cy)
        scored.append((overlap, -comp["area"], dist, comp))
    scored.sort(key=lambda item: (-item[0], item[1], item[2]))
    main = scored[0][3]

    ml, mt, mr, mb = main["bbox"]
    mw = mr - ml
    mh = mb - mt
    keep = [main]
    for comp in comps:
        if comp is main:
            continue
        cl, ct, cr, cb = comp["bbox"]
        overlap = intersection_area(comp["bbox"], core_rect)
        if overlap > 0:
            keep.append(comp)
            continue
        near_head_signal = (
            cr <= ml + mw * 0.35
            and ct <= mt + mh * 0.45
            and comp["area"] <= main["area"] * 0.05
        )
        if near_head_signal:
            keep.append(comp)

    out = Image.new("RGBA", (tx1 - tx0, ty1 - ty0), (0, 0, 0, 0))
    src_px = expanded.load()
    dst_px = out.load()
    for comp in keep:
        for x, y in comp["pts"]:
            if tx0 <= x < tx1 and ty0 <= y < ty1:
                dst_px[x - tx0, y - ty0] = src_px[x, y]
    return out


def place_on_canvas(im: Image.Image, canvas_size: int, fit_size: int, y_offset: int) -> Image.Image:
    sprite = im.copy()
    sprite.thumbnail((fit_size, fit_size), Image.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x = (canvas_size - sprite.width) // 2
    y = (canvas_size - sprite.height) // 2 + y_offset
    x = max(28, min(canvas_size - sprite.width - 28, x))
    y = max(28, min(canvas_size - sprite.height - 28, y))
    canvas.alpha_composite(sprite, (x, y))
    return canvas


def place_cell_on_canvas(im: Image.Image, canvas_size: int, fit_size: int, y_offset: int) -> Image.Image:
    scale = min(fit_size / im.width, fit_size / im.height)
    target_size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    sprite = im.resize(target_size, Image.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x = (canvas_size - sprite.width) // 2
    y = (canvas_size - sprite.height) // 2 + y_offset
    canvas.alpha_composite(sprite, (x, y))
    return canvas


def sanitize_final_canvas(im: Image.Image, threshold: int = 8) -> Image.Image:
    components = connected_components(im, threshold=threshold)
    if not components:
        return im

    main = components[0]
    ml, mt, mr, mb = main["bbox"]
    mw = mr - ml
    mh = mb - mt

    cleaned = Image.new("RGBA", im.size, (0, 0, 0, 0))
    src_px = im.load()
    dst_px = cleaned.load()

    keep = [main]
    for comp in components[1:]:
        cl, ct, cr, cb = comp["bbox"]
        overlap = intersection_area(comp["bbox"], main["bbox"])
        gap_x = max(0, ml - cr, cl - mr)
        gap_y = max(0, mt - cb, ct - mb)
        near_head_signal = (
            cr <= ml + mw * 0.28
            and cl >= ml - mw * 0.18
            and cb <= mt + mh * 0.42
            and comp["area"] >= 24
            and gap_x <= mw * 0.12
            and gap_y <= mh * 0.12
        )
        near_body = overlap > 0 or (gap_x <= mw * 0.06 and gap_y <= mh * 0.06)
        if near_head_signal or near_body:
            keep.append(comp)

    for comp in keep:
        for x, y in comp["pts"]:
            dst_px[x, y] = src_px[x, y]
    return cleaned


def shift_to_baseline(im: Image.Image, baseline: int, threshold: int = 8) -> Image.Image:
    bbox = alpha_bbox(im, threshold=threshold)
    if not bbox:
        return im
    _, _, _, bottom = bbox
    dy = baseline - bottom
    if dy == 0:
        return im
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.alpha_composite(im, (0, dy))
    return out


def inspect_cell(im: Image.Image, min_margin: int, min_component_ratio: float):
    bbox = alpha_bbox(im)
    if not bbox:
        return {
            "ok": False,
            "reasons": ["empty-cell"],
            "bbox": None,
            "margins": None,
            "components": [],
        }

    left, top, right, bottom = bbox
    margins = {
        "left": left,
        "top": top,
        "right": im.width - right,
        "bottom": im.height - bottom,
    }
    reasons = []
    for edge, value in margins.items():
        if value < min_margin:
            reasons.append(f"touching-{edge}-edge:{value}")

    components = connected_components(im)
    if components:
        main = components[0]
        for comp in components[1:]:
            ratio = comp["area"] / max(1, main["area"])
            if ratio >= min_component_ratio:
                reasons.append(
                    "secondary-component:"
                    f"area={comp['area']},ratio={ratio:.3f},bbox={comp['bbox']}"
                )

    return {
        "ok": not reasons,
        "reasons": reasons,
        "bbox": bbox,
        "margins": margins,
        "components": component_preview(components),
    }


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--states", required=True, help="Comma-separated states in reading order")
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--canvas-size", type=int, default=640)
    parser.add_argument("--fit-size", type=int, default=500)
    parser.add_argument("--y-offset", type=int, default=8)
    parser.add_argument("--min-raw-margin", type=int, default=24)
    parser.add_argument("--min-component-ratio", type=float, default=0.015)
    parser.add_argument("--spill", type=int, default=72)
    parser.add_argument("--report", default="")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--preserve-cell-layout", action="store_true")
    parser.add_argument("--alpha-baseline", type=int, default=-1)
    return parser.parse_args()


def main():
    args = parse_args()
    sheet_path = Path(args.sheet)
    out_dir = Path(args.out_dir)
    states = [state.strip() for state in args.states.split(",") if state.strip()]
    if len(states) != args.cols * args.rows:
        raise SystemExit("state count does not match cols * rows")

    out_dir.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(sheet_path).convert("RGBA")
    cell_w = sheet.width // args.cols
    cell_h = sheet.height // args.rows

    report = {
        "sheet": str(sheet_path),
        "cell_size": [cell_w, cell_h],
        "checks": [],
    }
    cropped_by_state = {}
    failures = []

    for index, state in enumerate(states):
        col = index % args.cols
        row = index // args.cols
        cell = sheet.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
        cleaned = remove_green(cell)
        inspection = inspect_cell(cleaned, args.min_raw_margin, args.min_component_ratio)
        inspection["state"] = state
        report["checks"].append(inspection)
        if inspection["ok"] or args.force:
            expanded, target_rect = crop_with_spill(
                sheet, col, row, cell_w, cell_h, args.cols, args.rows, args.spill
            )
            expanded_cleaned = remove_green(expanded)
            if args.preserve_cell_layout:
                cropped_by_state[state] = recover_subject_in_target(expanded_cleaned, target_rect)
            else:
                cropped_by_state[state] = recover_main_subject(expanded_cleaned, target_rect)
        else:
            failures.append((state, inspection["reasons"]))

    if failures and not args.force:
        if args.report:
            Path(args.report).write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(json.dumps(report, indent=2))
        raise SystemExit(1)

    for state, cropped in cropped_by_state.items():
        if args.preserve_cell_layout:
            final = place_cell_on_canvas(cropped, args.canvas_size, args.fit_size, args.y_offset)
        else:
            final = place_on_canvas(cropped, args.canvas_size, args.fit_size, args.y_offset)
        final = sanitize_final_canvas(final)
        if args.alpha_baseline >= 0:
            final = shift_to_baseline(final, args.alpha_baseline)
        final.save(out_dir / f"{state}.png")

    if args.report:
        Path(args.report).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
