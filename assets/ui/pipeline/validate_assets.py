import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "assets_manifest.json"


def fail(message):
    raise SystemExit(f"Asset pipeline validation failed: {message}")


def main():
    manifest = json.loads(MANIFEST.read_text())
    base = ROOT / manifest.get("basePath", "./")

    for key, spec in manifest["assets"].items():
        path = (base / spec["file"]).resolve()
        if not path.exists():
            fail(f"{key} missing file {path}")

        with Image.open(path) as image:
            if image.size != (spec["width"], spec["height"]):
                fail(f"{key} size is {image.size}, expected {(spec['width'], spec['height'])}")

            if spec.get("transparent") and image.mode != "RGBA":
                fail(f"{key} must be RGBA for transparent PNG, got {image.mode}")

            if spec["type"] == "spriteSheet":
                grid = spec["grid"]
                expected_width = grid["columns"] * grid["frameWidth"]
                expected_height = grid["rows"] * grid["frameHeight"]
                expected_frames = grid["columns"] * grid["rows"]
                if (expected_width, expected_height) != image.size:
                    fail(f"{key} grid does not match image size")
                if expected_frames != spec["frames"]:
                    fail(f"{key} grid frame count does not match frames")

            if spec["type"] == "nineSlice":
                inset = spec["nineSlice"]
                if inset["left"] + inset["right"] >= spec["width"]:
                    fail(f"{key} horizontal 9-slice inset too large")
                if inset["top"] + inset["bottom"] >= spec["height"]:
                    fail(f"{key} vertical 9-slice inset too large")

    print(f"Asset pipeline validation passed: {len(manifest['assets'])} assets")


if __name__ == "__main__":
    main()
