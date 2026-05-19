import type { JudgeResult, Motif, MotifCategory, MotifDifficulty } from "./types";
import type { CanvasAnalysis } from "./drawing/imageStats";
import { fallbackScoreFromCanvasAnalysis } from "./drawing/imageStats";

const CASUAL_FALLBACK: Motif[] = [
  { name: "Rocket", hint: "pointy rocket with flames", difficulty: "easy", category: "vehicle" },
  { name: "Cactus", hint: "spiky plant in a pot", difficulty: "easy", category: "nature" },
  { name: "Ghost", hint: "wavy white ghost with eyes", difficulty: "easy", category: "fantasy" },
  { name: "Robot", hint: "square robot with antennas", difficulty: "medium", category: "object" },
  { name: "Pirate Ship", hint: "ship with skull flag", difficulty: "hard", category: "vehicle" },
];

const ARTIST_FALLBACK: Motif[] = [
  { name: "Melting Clock", hint: "soft clock bending over an edge", difficulty: "artist", category: "composition" },
  { name: "Floating Island", hint: "small island with tree in the sky", difficulty: "artist", category: "scene" },
  { name: "Neon Jellyfish", hint: "glowing jellyfish with long tentacles", difficulty: "artist", category: "animal" },
  { name: "Space Turtle", hint: "turtle floating with stars", difficulty: "artist", category: "animal" },
];

const ALLOWED_DIFFICULTIES: MotifDifficulty[] = ["easy", "medium", "hard", "artist"];
const ALLOWED_CATEGORIES: MotifCategory[] = [
  "object", "animal", "food", "nature", "vehicle", "place",
  "fantasy", "action", "scene", "emotion", "composition", "funny",
];

function pickFallback(artistMode: boolean): Motif {
  const pool = artistMode ? ARTIST_FALLBACK : CASUAL_FALLBACK;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return { ...choice, artistMode, source: "local" };
}

function coerceMotif(raw: unknown, artistMode: boolean): Motif | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name : typeof value.motif === "string" ? value.motif : "";
  const hint = typeof value.hint === "string" ? value.hint : "";
  const difficulty = typeof value.difficulty === "string" ? value.difficulty : "easy";
  const category = typeof value.category === "string" ? value.category : "object";
  if (!name) return null;

  const safeDifficulty = (ALLOWED_DIFFICULTIES as string[]).includes(difficulty)
    ? (difficulty as MotifDifficulty)
    : artistMode ? "artist" : "easy";
  const safeCategory = (ALLOWED_CATEGORIES as string[]).includes(category)
    ? (category as MotifCategory)
    : "object";

  return {
    name,
    hint: hint || "draw the main shape clearly",
    difficulty: safeDifficulty,
    category: safeCategory,
    artistMode: typeof value.artistMode === "boolean" ? value.artistMode : artistMode,
    source: typeof value.source === "string" ? value.source : "ollama",
    model: typeof value.model === "string" ? value.model : undefined,
  };
}

export async function requestMotif(args: {
  round: number;
  totalRounds: number;
  players: string[];
  recentMotifs: string[];
  recentCategories: string[];
  artistMode: boolean;
}): Promise<Motif> {
  try {
    const response = await fetch("/api/motif", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        round: args.round,
        totalRounds: args.totalRounds,
        players: args.players,
        recentMotifs: args.recentMotifs,
        recentCategories: args.recentCategories,
        difficulty: args.artistMode ? "artist" : "mixed",
        artistMode: args.artistMode,
        language: "en",
      }),
    });
    if (!response.ok) throw new Error(`motif failed: ${response.status}`);
    const data = await response.json();
    const motif = coerceMotif(data, args.artistMode);
    if (motif) return motif;
    throw new Error("motif payload invalid");
  } catch {
    return pickFallback(args.artistMode);
  }
}

export async function requestJudge(args: {
  motif: string;
  imageBase64: string;
  actionCount: number;
  artistMode: boolean;
  canvasAnalysis?: CanvasAnalysis;
}): Promise<JudgeResult> {
  try {
    const response = await fetch("/api/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        motif: args.motif,
        imageBase64: args.imageBase64,
        actionCount: args.actionCount,
        artistMode: args.artistMode,
        canvasAnalysis: args.canvasAnalysis,
      }),
    });
    if (!response.ok) throw new Error(`judge failed: ${response.status}`);
    return (await response.json()) as JudgeResult;
  } catch {
    const h = fallbackScoreFromCanvasAnalysis(args.canvasAnalysis, args.actionCount);
    const cap = args.artistMode ? 60 : 70;
    return {
      ...h,
      score: Math.min(h.score, cap),
      recognition: Math.min(h.recognition, cap),
      detectedObject: "unverified",
      feedback: "Fallback score used. Motif match could not be fully verified.",
      source: "local",
      judgeMode: "fallback",
      artistMode: args.artistMode,
    };
  }
}
