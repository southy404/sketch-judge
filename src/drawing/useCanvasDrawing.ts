import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import {
  clearCanvas,
  drawDot,
  drawShape,
  drawSmoothSegment,
  getCanvasPoint,
} from "./canvasMath";
import type { Point, ShapeTool } from "./canvasMath";
import { floodFill } from "./floodFill";

export type Tool = "pen" | "eraser" | "fill" | "line" | "circle" | "rect";
export type ShapeFillMode = "outline" | "filled";

const MAX_UNDO = 25;

type Options = {
  width: number;
  height: number;
  baseBackground: string;
  tool: Tool;
  color: string;
  size: number;
  shapeFill: ShapeFillMode;
};

export type UseCanvasDrawingResult = {
  mainRef: RefObject<HTMLCanvasElement | null>;
  previewRef: RefObject<HTMLCanvasElement | null>;
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  undo: () => void;
  clear: () => void;
  exportPng: () => string;
  actionCount: number;
  canUndo: boolean;
};

export function useCanvasDrawing(options: Options): UseCanvasDrawingResult {
  const mainRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  const undoStackRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<Point | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const prevPointRef = useRef<Point | null>(null);
  const activeToolRef = useRef<Tool>(options.tool);
  const initRef = useRef(false);

  const [actionCount, setActionCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);

  // Initialize canvases once.
  useEffect(() => {
    const main = mainRef.current;
    const preview = previewRef.current;
    if (!main || !preview) return;
    if (initRef.current) return;
    initRef.current = true;

    main.width = options.width;
    main.height = options.height;
    preview.width = options.width;
    preview.height = options.height;

    const ctx = main.getContext("2d");
    if (ctx) clearCanvas(ctx, options.baseBackground);

    undoStackRef.current = [];
    setActionCount(0);
    setCanUndo(false);
    // We intentionally only init once; resizing the logical canvas would
    // change drawings, so the size is fixed for a session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapshot = useCallback(() => {
    const main = mainRef.current;
    if (!main) return;
    const ctx = main.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, main.width, main.height);
    const stack = undoStackRef.current;
    stack.push(data);
    if (stack.length > MAX_UNDO) stack.shift();
    setCanUndo(true);
  }, []);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    const data = stack.pop();
    if (!data) return;
    const main = mainRef.current;
    if (!main) return;
    const ctx = main.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(data, 0, 0);
    setCanUndo(stack.length > 0);
    setActionCount((c) => Math.max(0, c - 1));
  }, []);

  const clear = useCallback(() => {
    const main = mainRef.current;
    const preview = previewRef.current;
    if (!main || !preview) return;
    const ctx = main.getContext("2d");
    const pctx = preview.getContext("2d");
    if (!ctx || !pctx) return;
    snapshot();
    clearCanvas(ctx, options.baseBackground);
    pctx.clearRect(0, 0, preview.width, preview.height);
    setActionCount((c) => c + 1);
  }, [options.baseBackground, snapshot]);

  const exportPng = useCallback((): string => {
    const main = mainRef.current;
    if (!main) return "";
    return main.toDataURL("image/png");
  }, []);

  const handleDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const main = mainRef.current;
      const preview = previewRef.current;
      if (!main || !preview) return;

      const ctx = main.getContext("2d");
      const pctx = preview.getContext("2d");
      if (!ctx || !pctx) return;

      const p = getCanvasPoint(event, preview);
      preview.setPointerCapture(event.pointerId);

      activeToolRef.current = options.tool;
      startPointRef.current = p;
      lastPointRef.current = p;
      prevPointRef.current = p;

      if (options.tool === "fill") {
        snapshot();
        const changed = floodFill(ctx, p.x, p.y, options.color);
        if (changed) {
          setActionCount((c) => c + 1);
        } else {
          // pop the snapshot we just took since nothing happened
          undoStackRef.current.pop();
          setCanUndo(undoStackRef.current.length > 0);
        }
        return;
      }

      isDrawingRef.current = true;
      snapshot();

      if (options.tool === "pen") {
        drawDot(ctx, p, options.color, options.size);
        return;
      }

      if (options.tool === "eraser") {
        drawDot(ctx, p, options.baseBackground, options.size);
        return;
      }

      // shape tools — no main canvas change yet, only preview during move
    },
    [options.baseBackground, options.color, options.size, options.tool, snapshot]
  );

  const handleMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      const main = mainRef.current;
      const preview = previewRef.current;
      if (!main || !preview) return;
      const ctx = main.getContext("2d");
      const pctx = preview.getContext("2d");
      if (!ctx || !pctx) return;

      const tool = activeToolRef.current;
      const p = getCanvasPoint(event, preview);
      const last = lastPointRef.current ?? p;
      const prev = prevPointRef.current ?? last;

      if (tool === "pen") {
        drawSmoothSegment(ctx, prev, last, p, options.color, options.size);
        prevPointRef.current = last;
        lastPointRef.current = p;
        return;
      }

      if (tool === "eraser") {
        drawSmoothSegment(
          ctx,
          prev,
          last,
          p,
          options.baseBackground,
          options.size * 2.2
        );
        prevPointRef.current = last;
        lastPointRef.current = p;
        return;
      }

      if (tool === "line" || tool === "circle" || tool === "rect") {
        const start = startPointRef.current ?? p;
        pctx.clearRect(0, 0, preview.width, preview.height);
        drawShape(pctx, tool as ShapeTool, start, p, {
          strokeColor: options.color,
          fillColor:
            tool === "line"
              ? null
              : options.shapeFill === "filled"
                ? options.color
                : null,
          width: options.size,
        });
        lastPointRef.current = p;
      }
    },
    [options.baseBackground, options.color, options.shapeFill, options.size]
  );

  const finishStroke = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const main = mainRef.current;
      const preview = previewRef.current;
      if (!main || !preview) return;
      const ctx = main.getContext("2d");
      const pctx = preview.getContext("2d");
      if (!ctx || !pctx) return;

      try {
        preview.releasePointerCapture(event.pointerId);
      } catch {
        // ignored
      }

      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      const tool = activeToolRef.current;
      const start = startPointRef.current;
      const end = lastPointRef.current;

      if ((tool === "line" || tool === "circle" || tool === "rect") && start && end) {
        pctx.clearRect(0, 0, preview.width, preview.height);
        drawShape(ctx, tool as ShapeTool, start, end, {
          strokeColor: options.color,
          fillColor:
            tool === "line"
              ? null
              : options.shapeFill === "filled"
                ? options.color
                : null,
          width: options.size,
        });
      }

      setActionCount((c) => c + 1);
      startPointRef.current = null;
      lastPointRef.current = null;
      prevPointRef.current = null;
    },
    [options.color, options.shapeFill, options.size]
  );

  return {
    mainRef,
    previewRef,
    onPointerDown: handleDown,
    onPointerMove: handleMove,
    onPointerUp: finishStroke,
    onPointerCancel: finishStroke,
    undo,
    clear,
    exportPng,
    actionCount,
    canUndo,
  };
}
