export type AppTab = "home" | "history" | "rank" | "profile" | "game";

export type Phase =
  | "settings"
  | "generating"
  | "reveal"
  | "drawing"
  | "judging"
  | "leaderboard"
  | "finished";

export type Player = {
  id: string;
  name: string;
  score: number;
  lastScore?: number;
  avatarColor: string;
};

export type DrawingSummary = {
  id: string;
  round: number;
  motif: string;
  playerId: string;
  playerName: string;
  avatarColor: string;
  score: number;
  imageBase64: string;
};

export type MotifDifficulty = "easy" | "medium" | "hard" | "artist";

export type MotifCategory =
  | "object"
  | "animal"
  | "food"
  | "nature"
  | "vehicle"
  | "place"
  | "fantasy"
  | "action"
  | "scene"
  | "emotion"
  | "composition"
  | "funny";

export type Motif = {
  name: string;
  hint: string;
  difficulty: MotifDifficulty;
  category: MotifCategory;
  artistMode?: boolean;
  source?: string;
  model?: string;
};

export type JudgeMode = "vision" | "text-only" | "fallback" | "blank";

export type JudgeResult = {
  score: number;
  recognition: number;
  shape: number;
  proportion?: number;
  details?: number;
  color?: number;
  composition?: number;
  creativity: number;
  effort: number;
  polish?: number;
  feedback: string;
  detectedObject?: string;
  targetMatch?: boolean;
  source: string;
  model?: string;
  judgeMode?: JudgeMode;
  artistMode?: boolean;
};

export type { Point } from "./drawing/canvasMath";
export type { Tool, ShapeFillMode } from "./drawing/useCanvasDrawing";
