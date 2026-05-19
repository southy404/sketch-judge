import type { PointerEvent as ReactPointerEvent } from "react";

export type Point = { x: number; y: number };

export type Rgba = [number, number, number, number];

export function getCanvasPoint(
  event: ReactPointerEvent<HTMLCanvasElement> | PointerEvent,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect();
  const clientX = "clientX" in event ? event.clientX : 0;
  const clientY = "clientY" in event ? event.clientY : 0;
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

export function hexToRgba(hex: string): Rgba {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return [r, g, b, 255];
  }
  if (h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = parseInt(h.slice(6, 8), 16);
    return [r, g, b, a];
  }
  return [0, 0, 0, 255];
}

export function colorDistance(a: Rgba, b: Rgba): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const da = a[3] - b[3];
  return dr * dr + dg * dg + db * db + da * da;
}

export function clearCanvas(ctx: CanvasRenderingContext2D, color: string): void {
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawDot(
  ctx: CanvasRenderingContext2D,
  p: Point,
  color: string,
  size: number
): void {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export function drawSmoothSegment(
  ctx: CanvasRenderingContext2D,
  prevPrev: Point,
  prev: Point,
  current: Point,
  color: string,
  width: number
): void {
  const midPrev = midpoint(prevPrev, prev);
  const midCurr = midpoint(prev, current);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(midPrev.x, midPrev.y);
  ctx.quadraticCurveTo(prev.x, prev.y, midCurr.x, midCurr.y);
  ctx.stroke();
  ctx.restore();
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export type ShapeTool = "line" | "circle" | "rect";

export type DrawShapeOptions = {
  strokeColor: string;
  fillColor: string | null;
  width: number;
};

export function drawShape(
  ctx: CanvasRenderingContext2D,
  tool: ShapeTool,
  start: Point,
  end: Point,
  options: DrawShapeOptions
): void {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = options.strokeColor;
  ctx.lineWidth = options.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "line") {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (tool === "circle") {
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (options.fillColor) {
      ctx.fillStyle = options.fillColor;
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(end.x - start.x);
  const h = Math.abs(end.y - start.y);
  const r = Math.min(12, w / 2, h / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
  if (options.fillColor) {
    ctx.fillStyle = options.fillColor;
    ctx.fill();
  }
  ctx.stroke();
  ctx.restore();
}
