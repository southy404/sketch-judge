import { forwardRef, useEffect, useImperativeHandle } from "react";
import type { ShapeFillMode, Tool } from "./useCanvasDrawing";
import { useCanvasDrawing } from "./useCanvasDrawing";
import { analyzeCanvasContent, emptyAnalysis } from "./imageStats";
import type { CanvasAnalysis } from "./imageStats";

export const CANVAS_WIDTH = 768;
export const CANVAS_HEIGHT = 768;
export const BASE_BG = "#fffef9";

type Props = {
  tool: Tool;
  color: string;
  size: number;
  shapeFill: ShapeFillMode;
  onActionCountChange?: (count: number) => void;
  onCanUndoChange?: (canUndo: boolean) => void;
};

export type CanvasDrawingHandle = {
  exportPng: () => string;
  exportAnalysis: () => CanvasAnalysis;
  undo: () => void;
  clear: () => void;
  getActionCount: () => number;
};

export const CanvasDrawing = forwardRef<CanvasDrawingHandle, Props>(function CanvasDrawing(
  { tool, color, size, shapeFill, onActionCountChange, onCanUndoChange },
  ref
) {
  const drawing = useCanvasDrawing({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    baseBackground: BASE_BG,
    tool,
    color,
    size,
    shapeFill,
  });

  useImperativeHandle(ref, () => ({
    exportPng: drawing.exportPng,
    exportAnalysis: () => {
      const canvas = drawing.mainRef.current;
      if (!canvas) return emptyAnalysis();
      return analyzeCanvasContent(canvas, BASE_BG);
    },
    undo: drawing.undo,
    clear: drawing.clear,
    getActionCount: () => drawing.actionCount,
  }));

  useEffect(() => {
    onActionCountChange?.(drawing.actionCount);
  }, [drawing.actionCount, onActionCountChange]);

  useEffect(() => {
    onCanUndoChange?.(drawing.canUndo);
  }, [drawing.canUndo, onCanUndoChange]);

  return (
    <div className="canvas-stack">
      <canvas ref={drawing.mainRef} className="canvas-layer canvas-main" />
      <canvas
        ref={drawing.previewRef}
        className="canvas-layer canvas-preview"
        onPointerDown={drawing.onPointerDown}
        onPointerMove={drawing.onPointerMove}
        onPointerUp={drawing.onPointerUp}
        onPointerCancel={drawing.onPointerCancel}
      />
    </div>
  );
});
