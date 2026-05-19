import { useEffect, useRef, useState } from "react";
import {
  Check,
  Circle,
  Eraser,
  Minus,
  PaintBucket,
  Pencil,
  Plus,
  RectangleHorizontal,
  RotateCcw,
  Slash,
  Trash2,
} from "lucide-react";
import { CanvasDrawing } from "../drawing/CanvasDrawing";
import type { CanvasDrawingHandle } from "../drawing/CanvasDrawing";
import { DEFAULT_COLOR, paletteGroups } from "../drawing/palette";
import { ToolButton } from "../drawing/ToolButton";
import type { CanvasAnalysis } from "../drawing/imageStats";
import type { ShapeFillMode, Tool } from "../drawing/useCanvasDrawing";
import { RoundProgress } from "./RoundProgress";
import { SvgUnderline } from "./SvgUnderline";

type Props = {
  motif: string;
  seconds: number;
  round: number;
  totalRounds: number;
  playerName: string;
  artistMode?: boolean;
  submit: (
    imageBase64: string,
    actionCount: number,
    analysis: CanvasAnalysis | undefined
  ) => void;
  submitting: boolean;
};

export function DrawingScreen(props: Props) {
  const canvasRef = useRef<CanvasDrawingHandle | null>(null);
  const autoSubmittedRef = useRef(false);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [size, setSize] = useState(9);
  const [shapeFill, setShapeFill] = useState<ShapeFillMode>("outline");
  const [actionCount, setActionCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);

  const isShapeTool = tool === "line" || tool === "circle" || tool === "rect";

  async function handleSubmit() {
    if (props.submitting) return;
    const handle = canvasRef.current;
    const png = handle ? handle.exportPng() : "";
    const analysis = handle ? handle.exportAnalysis() : undefined;
    props.submit(png, actionCount, analysis);
  }

  useEffect(() => {
    if (props.seconds > 0) return;
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    void handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.seconds]);

  return (
    <section className="screen drawing">
      <div className="screen-top drawing-top">
        <RoundProgress round={props.round} totalRounds={props.totalRounds} />
        {props.artistMode && <span className="artist-pill">artist mode</span>}
        <span className={`timer-pill${props.seconds <= 10 ? " danger" : ""}`}>
          00:{String(Math.max(0, props.seconds)).padStart(2, "0")}
        </span>
      </div>

      <div className="draw-title">
        <span className="draw-label">draw:</span>
        <span className="motif-word prompt-motif">
          {props.motif}
          <SvgUnderline className="small-underline prompt-underline" />
        </span>
      </div>

      <div className="drawing-stage">
        <CanvasDrawing
          ref={canvasRef}
          tool={tool}
          color={color}
          size={size}
          shapeFill={shapeFill}
          onActionCountChange={setActionCount}
          onCanUndoChange={setCanUndo}
        />
      </div>

      <div className="drawing-toolbar">
        <div className="tool-row">
          <ToolButton label="pen" active={tool === "pen"} onClick={() => setTool("pen")}>
            <Pencil size={18} />
          </ToolButton>
          <ToolButton label="eraser" active={tool === "eraser"} onClick={() => setTool("eraser")}>
            <Eraser size={18} />
          </ToolButton>
          <ToolButton label="fill bucket" active={tool === "fill"} onClick={() => setTool("fill")}>
            <PaintBucket size={18} />
          </ToolButton>
          <ToolButton label="line" active={tool === "line"} onClick={() => setTool("line")}>
            <Slash size={18} />
          </ToolButton>
          <ToolButton label="circle" active={tool === "circle"} onClick={() => setTool("circle")}>
            <Circle size={18} />
          </ToolButton>
          <ToolButton label="rectangle" active={tool === "rect"} onClick={() => setTool("rect")}>
            <RectangleHorizontal size={18} />
          </ToolButton>

          <div
            className={`shape-fill-toggle${isShapeTool ? "" : " is-dim"}`}
            role="group"
            aria-label="shape fill mode"
          >
            <button
              type="button"
              className={shapeFill === "outline" ? "active" : ""}
              onClick={() => setShapeFill("outline")}
            >
              outline
            </button>
            <button
              type="button"
              className={shapeFill === "filled" ? "active" : ""}
              onClick={() => setShapeFill("filled")}
            >
              filled
            </button>
          </div>
        </div>

        <div className="palette-grid" role="group" aria-label="color palette">
          {paletteGroups.flatMap((group) =>
            group.colors.map((c) => (
              <button
                key={c}
                type="button"
                className={c === color ? "swatch active" : "swatch"}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`${group.name} ${c}`}
                aria-pressed={c === color}
              />
            ))
          )}
        </div>

        <div className="size-row">
          <button
            type="button"
            className="size-step"
            onClick={() => setSize(Math.max(3, size - 3))}
            aria-label="smaller brush"
          >
            <Minus size={16} />
          </button>
          <input
            type="range"
            min={3}
            max={30}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            aria-label="brush size"
          />
          <button
            type="button"
            className="size-step"
            onClick={() => setSize(Math.min(30, size + 3))}
            aria-label="bigger brush"
          >
            <Plus size={16} />
          </button>
          <span className="size-preview" aria-hidden>
            <span style={{ width: size, height: size, background: color }} />
          </span>
        </div>

        <div className="action-row">
          <button
            type="button"
            className="action-btn"
            onClick={() => canvasRef.current?.undo()}
            disabled={!canUndo}
            aria-label="undo"
          >
            <RotateCcw size={18} />
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => canvasRef.current?.clear()}
            aria-label="clear"
          >
            <Trash2 size={18} />
          </button>
          <button
            type="button"
            className="action-btn submit"
            onClick={handleSubmit}
            disabled={props.submitting}
            aria-label="submit drawing"
          >
            <Check size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
