export async function loadAssetManifest(url = './assets_manifest.json') {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Asset manifest failed to load: ${response.status} ${url}`);
  }
  const manifest = await response.json();
  return { manifest, manifestUrl: new URL(url, window.location.href) };
}

export async function loadPipelineAssets(manifest, manifestUrl) {
  const basePath = new URL(manifest.basePath || './', manifestUrl);
  const entries = Object.entries(manifest.assets);
  const images = {};

  await Promise.all(entries.map(([key, spec]) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      images[key] = image;
      resolve();
    };
    image.onerror = () => reject(new Error(`Asset image failed to load: ${spec.file}`));
    image.src = new URL(spec.file, basePath).href;
  })));

  return images;
}

export function getFrameRect(spec, frameIndex) {
  if (spec.type !== 'spriteSheet') {
    return { x: 0, y: 0, width: spec.width, height: spec.height };
  }

  const frame = Math.max(0, Math.min(spec.frames - 1, frameIndex | 0));
  const { columns, frameWidth, frameHeight } = spec.grid;
  return {
    x: (frame % columns) * frameWidth,
    y: Math.floor(frame / columns) * frameHeight,
    width: frameWidth,
    height: frameHeight
  };
}

export function getAnimationFrame(spec, elapsedMs) {
  if (spec.type !== 'spriteSheet') return 0;
  const fps = spec.fps || 8;
  return Math.floor((elapsedMs / 1000) * fps) % spec.frames;
}

export function drawSprite(ctx, image, spec, x, y, width = spec.width, height = spec.height) {
  ctx.drawImage(image, 0, 0, spec.width, spec.height, x, y, width, height);
}

export function drawSpriteFrame(ctx, image, spec, frameIndex, x, y, width, height) {
  const frame = getFrameRect(spec, frameIndex);
  ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height, x, y, width, height);
}

export function drawNineSlice(ctx, image, spec, x, y, width, height) {
  const inset = spec.nineSlice;
  if (!inset) {
    drawSprite(ctx, image, spec, x, y, width, height);
    return;
  }

  const sx = [0, inset.left, spec.width - inset.right, spec.width];
  const sy = [0, inset.top, spec.height - inset.bottom, spec.height];
  const dx = [x, x + inset.left, x + width - inset.right, x + width];
  const dy = [y, y + inset.top, y + height - inset.bottom, y + height];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const sw = sx[col + 1] - sx[col];
      const sh = sy[row + 1] - sy[row];
      const dw = dx[col + 1] - dx[col];
      const dh = dy[row + 1] - dy[row];
      if (sw > 0 && sh > 0 && dw > 0 && dh > 0) {
        ctx.drawImage(image, sx[col], sy[row], sw, sh, dx[col], dy[row], dw, dh);
      }
    }
  }
}

