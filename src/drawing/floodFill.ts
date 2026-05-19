import { colorDistance, hexToRgba } from "./canvasMath";
import type { Rgba } from "./canvasMath";

export const FILL_TOLERANCE = 34;
export const FILL_HALO_TOLERANCE = 78;
export const FILL_CLEANUP_PASSES = 2;
export const DARK_BOUNDARY_BRIGHTNESS = 95;

export function floodFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillHex: string,
  tolerance: number = FILL_TOLERANCE
): boolean {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px < 0 || py < 0 || px >= w || py >= h) return false;

  const fill = hexToRgba(fillHex);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const startIdx = (py * w + px) * 4;
  const target: Rgba = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3],
  ];

  if (colorDistance(target, fill) <= 1) return false;

  const tolSq = tolerance * tolerance;
  if (colorDistance(target, fill) <= tolSq) return false;

  const filled = new Uint8Array(w * h);
  const stack: number[] = [px, py];
  let changed = false;

  while (stack.length) {
    const sy = stack.pop() as number;
    const sx = stack.pop() as number;

    let lx = sx;
    let idx = (sy * w + lx) * 4;
    while (lx >= 0 && pixelMatches(data, idx, target, tolSq)) {
      lx--;
      idx -= 4;
    }
    lx++;
    idx += 4;

    let aboveMatched = false;
    let belowMatched = false;

    while (lx < w && pixelMatches(data, idx, target, tolSq)) {
      data[idx] = fill[0];
      data[idx + 1] = fill[1];
      data[idx + 2] = fill[2];
      data[idx + 3] = fill[3];
      filled[sy * w + lx] = 1;
      changed = true;

      if (sy > 0) {
        const aboveIdx = idx - w * 4;
        if (pixelMatches(data, aboveIdx, target, tolSq)) {
          if (!aboveMatched) {
            stack.push(lx, sy - 1);
            aboveMatched = true;
          }
        } else {
          aboveMatched = false;
        }
      }

      if (sy < h - 1) {
        const belowIdx = idx + w * 4;
        if (pixelMatches(data, belowIdx, target, tolSq)) {
          if (!belowMatched) {
            stack.push(lx, sy + 1);
            belowMatched = true;
          }
        } else {
          belowMatched = false;
        }
      }

      lx++;
      idx += 4;
    }
  }

  if (changed) {
    cleanupFillHalo(data, filled, w, h, fill, target);
    ctx.putImageData(imageData, 0, 0);
  }
  return changed;
}

function pixelMatches(
  data: Uint8ClampedArray,
  idx: number,
  target: Rgba,
  tolSq: number
): boolean {
  const dr = data[idx] - target[0];
  const dg = data[idx + 1] - target[1];
  const db = data[idx + 2] - target[2];
  const da = data[idx + 3] - target[3];
  return dr * dr + dg * dg + db * db + da * da <= tolSq;
}

// After flood fill, walk pixels adjacent to filled area and absorb any that
// are clearly light/antialiased halo (not a real outline). Two passes by
// default; stops early if a pass changes nothing. Dark boundary pixels are
// always preserved so outlines survive.
function cleanupFillHalo(
  data: Uint8ClampedArray,
  filled: Uint8Array,
  w: number,
  h: number,
  fill: Rgba,
  target: Rgba
): void {
  const haloSq = FILL_HALO_TOLERANCE * FILL_HALO_TOLERANCE;

  for (let pass = 0; pass < FILL_CLEANUP_PASSES; pass++) {
    const toFill: number[] = [];

    for (let i = 0; i < filled.length; i++) {
      if (filled[i]) continue;
      const idx = i * 4;
      const a = data[idx + 3];
      if (a < 20) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (isDarkBoundary(r, g, b)) continue;
      if (!isHaloPixel(r, g, b, target, haloSq)) continue;

      const x = i % w;
      const y = (i - x) / w;

      const hasFilledNeighbor =
        (x > 0 && filled[i - 1] === 1) ||
        (x < w - 1 && filled[i + 1] === 1) ||
        (y > 0 && filled[i - w] === 1) ||
        (y < h - 1 && filled[i + w] === 1);

      if (hasFilledNeighbor) toFill.push(i);
    }

    if (toFill.length === 0) break;

    for (const i of toFill) {
      const idx = i * 4;
      data[idx] = fill[0];
      data[idx + 1] = fill[1];
      data[idx + 2] = fill[2];
      data[idx + 3] = fill[3];
      filled[i] = 1;
    }
  }
}

function isDarkBoundary(r: number, g: number, b: number): boolean {
  return (r + g + b) / 3 < DARK_BOUNDARY_BRIGHTNESS;
}

function isHaloPixel(
  r: number,
  g: number,
  b: number,
  target: Rgba,
  haloSq: number
): boolean {
  const brightness = (r + g + b) / 3;
  if (brightness > 180) return true;
  const dr = r - target[0];
  const dg = g - target[1];
  const db = b - target[2];
  return dr * dr + dg * dg + db * db <= haloSq;
}
