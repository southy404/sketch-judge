import { hexToRgba } from "./canvasMath.js";

export type Bbox = { x: number; y: number; width: number; height: number };

export type CanvasAnalysis = {
  changedPixelRatio: number;
  bbox: Bbox | null;
  isBlank: boolean;
  colorVarietyBuckets: number;
  // Extended quality metrics (used for artist-mode guards).
  inkCoverage: number;
  boundingBoxCoverage: number;
  colorCount: number;
  usesColor: boolean;
  mostlyBlackLine: boolean;
  isTinyDrawing: boolean;
  isSparseDrawing: boolean;
  edgeComplexity: number;
};

export type HeuristicJudge = {
  score: number;
  recognition: number;
  shape: number;
  details: number;
  creativity: number;
  effort: number;
};

const SAMPLE_STEP = 2;
const NEAR_BG_DISTANCE = 18 * 18 * 3;
const BLANK_RATIO_THRESHOLD = 0.0015;
const BLANK_BBOX_MIN = 24;
const COLOR_BUCKET_BITS = 3;
const CANVAS_REF_SIDE = 1024;
const COLOR_SATURATION_THRESHOLD = 0.22;
const DARK_LUMA_MAX = 90;
const HUE_BINS = 12;
const MIN_HUE_BIN_PIXELS = 8;
const TINY_BBOX_RATIO = 0.08;
const SPARSE_INK_RATIO = 0.015;

export function emptyAnalysis(): CanvasAnalysis {
  return {
    changedPixelRatio: 0,
    bbox: null,
    isBlank: true,
    colorVarietyBuckets: 0,
    inkCoverage: 0,
    boundingBoxCoverage: 0,
    colorCount: 0,
    usesColor: false,
    mostlyBlackLine: false,
    isTinyDrawing: true,
    isSparseDrawing: true,
    edgeComplexity: 0,
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let s = 0;
  let h = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0));
    else if (max === gn) h = ((bn - rn) / d + 2);
    else h = ((rn - gn) / d + 4);
    h *= 60;
  }
  return { h, s, l };
}

export function analyzeCanvasContent(
  canvas: HTMLCanvasElement,
  bgHex: string
): CanvasAnalysis {
  const ctx = canvas.getContext("2d");
  if (!ctx) return emptyAnalysis();

  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return emptyAnalysis();

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const bg = hexToRgba(bgHex);

  let nonBgCount = 0;
  let sampledTotal = 0;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  const buckets = new Set<number>();
  const bucketMask = (1 << COLOR_BUCKET_BITS) - 1;

  let colorPixelCount = 0;
  let darkPixelCount = 0;
  const hueBinCounts = new Array<number>(HUE_BINS).fill(0);

  for (let y = 0; y < h; y += SAMPLE_STEP) {
    for (let x = 0; x < w; x += SAMPLE_STEP) {
      sampledTotal++;
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a < 8) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dr = r - bg[0];
      const dg = g - bg[1];
      const db = b - bg[2];
      const distSq = dr * dr + dg * dg + db * db;
      if (distSq <= NEAR_BG_DISTANCE) continue;

      nonBgCount++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;

      if (buckets.size < 64) {
        const bucket =
          ((r >> (8 - COLOR_BUCKET_BITS)) & bucketMask) |
          (((g >> (8 - COLOR_BUCKET_BITS)) & bucketMask) << COLOR_BUCKET_BITS) |
          (((b >> (8 - COLOR_BUCKET_BITS)) & bucketMask) << (COLOR_BUCKET_BITS * 2));
        buckets.add(bucket);
      }

      const hsl = rgbToHsl(r, g, b);
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (hsl.s >= COLOR_SATURATION_THRESHOLD) {
        colorPixelCount++;
        const bin = Math.floor((hsl.h % 360) / (360 / HUE_BINS));
        const safeBin = bin < 0 ? bin + HUE_BINS : bin;
        hueBinCounts[safeBin % HUE_BINS]++;
      } else if (luma <= DARK_LUMA_MAX || hsl.l <= 0.3) {
        darkPixelCount++;
      }
    }
  }

  const changedPixelRatio = sampledTotal > 0 ? nonBgCount / sampledTotal : 0;
  const bbox: Bbox | null =
    maxX >= 0 && maxY >= 0
      ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
      : null;

  const tinyMark =
    bbox !== null && bbox.width < BLANK_BBOX_MIN && bbox.height < BLANK_BBOX_MIN;
  const isBlank = bbox === null || changedPixelRatio < BLANK_RATIO_THRESHOLD || tinyMark;

  const canvasArea = w * h;
  const bboxArea = bbox ? bbox.width * bbox.height : 0;
  const boundingBoxCoverage = canvasArea > 0 ? bboxArea / canvasArea : 0;

  const colorRatio = nonBgCount > 0 ? colorPixelCount / nonBgCount : 0;
  const darkRatio = nonBgCount > 0 ? darkPixelCount / nonBgCount : 0;

  const colorCount = hueBinCounts.filter((c) => c >= MIN_HUE_BIN_PIXELS).length;
  const usesColor = colorRatio > 0.05 && colorCount > 0;
  const mostlyBlackLine = !usesColor || darkRatio >= 0.6;
  const isTinyDrawing = boundingBoxCoverage < TINY_BBOX_RATIO;
  const isSparseDrawing = changedPixelRatio < SPARSE_INK_RATIO;

  const edgeComplexity = bboxArea > 0
    ? Math.min(1, (nonBgCount * SAMPLE_STEP * SAMPLE_STEP) / bboxArea)
    : 0;

  return {
    changedPixelRatio,
    bbox,
    isBlank,
    colorVarietyBuckets: buckets.size,
    inkCoverage: changedPixelRatio,
    boundingBoxCoverage,
    colorCount,
    usesColor,
    mostlyBlackLine,
    isTinyDrawing,
    isSparseDrawing,
    edgeComplexity,
  };
}

// Pure, no DOM — safe to import on the server.
export function fallbackScoreFromCanvasAnalysis(
  a: CanvasAnalysis | null | undefined,
  actionCount: number
): HeuristicJudge {
  if (!a || a.isBlank) {
    return { score: 0, recognition: 0, shape: 0, details: 0, creativity: 0, effort: 0 };
  }

  const coverageScore = Math.min(45, a.changedPixelRatio * 9000);
  const bboxArea = a.bbox
    ? (a.bbox.width * a.bbox.height) / (CANVAS_REF_SIDE * CANVAS_REF_SIDE)
    : 0;
  const bboxScore = Math.min(25, bboxArea * 120);
  const actionScore = Math.min(20, actionCount * 2);

  let s = Math.round(coverageScore + bboxScore + actionScore);
  if (s < 10 && actionCount <= 1) s = Math.max(1, s);
  s = Math.max(0, Math.min(70, s));

  const stars = Math.max(0, Math.min(5, Math.round(s / 20)));
  const variety = Math.max(0, Math.round(a.colorVarietyBuckets));
  const detailHit = a.changedPixelRatio > 0.05;

  return {
    score: s,
    recognition: Math.min(25, s),
    shape: stars,
    details: Math.max(0, stars - (detailHit ? 0 : 1)),
    creativity: Math.max(0, Math.min(5, stars + (variety >= 4 ? 1 : 0))),
    effort: Math.max(0, Math.min(5, stars + (a.changedPixelRatio > 0.1 ? 1 : 0))),
  };
}
