import express from "express";
import cors from "cors";
import { fallbackScoreFromCanvasAnalysis } from "../src/drawing/imageStats";
import type { CanvasAnalysis } from "../src/drawing/imageStats";
import { feedbackForScore } from "../src/scoring";
import {
  pickFallbackMotif,
  type MotifCategory,
  type MotifDifficulty,
  type MotifSeed,
} from "./motifs";
import {
  isBoringMotif,
  isUnsafeMotif,
  isValidMotif,
} from "./motifValidation";
import {
  applyFinalScoreGuardsWithBreakdown,
  isProblemFeedback,
  runJudgeGuardSelfTest,
  sanitizeArtistFeedback,
  type DrawingQuality,
} from "./judgeScoring";

const app = express();
const port = Number(process.env.PORT || 8789);
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:e4b";

app.use(cors());
app.use(express.json({ limit: "20mb" }));

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function clampInt(n: unknown, min: number, max: number): number {
  const value = Math.round(Number(n));
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeScore(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  if (n >= 0 && n <= 5) return Math.round((n / 5) * 100);
  if (n > 5 && n <= 10) return Math.round((n / 10) * 100);
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeRating(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  if (n > 5) return Math.max(0, Math.min(5, Math.round(n / 20)));
  return Math.max(0, Math.min(5, Math.round(n)));
}

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function detectedObjectDiffersFromTarget(target: string, detectedObject: string): boolean {
  const targetNorm = normalizeText(target);
  const detectedNorm = normalizeText(detectedObject || "");
  if (!targetNorm || !detectedNorm) return false;

  const genericDetections = [
    "object", "drawing", "sketch", "image", "picture",
    "thing", "unknown", "unclear", "unverified",
  ];
  if (
    genericDetections.some(
      (word) => detectedNorm === word || detectedNorm === `a ${word}` || detectedNorm === `an ${word}`
    )
  ) {
    return false;
  }

  return !detectedNorm.includes(targetNorm) && !targetNorm.includes(detectedNorm);
}

function feedbackSaysTargetMissing(feedback: string): boolean {
  const feedbackNorm = normalizeText(feedback || "");
  return (
    feedbackNorm.includes("target is missing") ||
    feedbackNorm.includes("target motif is missing") ||
    feedbackNorm.includes("missing the target") ||
    feedbackNorm.includes("target was missing") ||
    feedbackNorm.includes("not shown") ||
    feedbackNorm.includes("no sign of")
  );
}

function motifAppearsWrong(target: string, detectedObject: string, feedback: string): boolean {
  const feedbackNorm = normalizeText(feedback || "");
  const detectedDiffers = detectedObjectDiffersFromTarget(target, detectedObject);

  const feedbackSaysWrong =
    feedbackNorm.includes("target was") ||
    feedbackNorm.includes("target motif") ||
    feedbackNorm.includes("wrong") ||
    feedbackNorm.includes("not the target") ||
    feedbackNorm.includes("focus on the target") ||
    feedbackNorm.includes("instead");

  return detectedDiffers && feedbackSaysWrong;
}

function feedbackImpliesWrongTarget(feedback: string): boolean {
  const feedbackNorm = normalizeText(feedback || "");
  return (
    feedbackNorm.includes("target was") ||
    feedbackNorm.includes("wrong motif") ||
    feedbackNorm.includes("wrong target") ||
    feedbackNorm.includes("not the target") ||
    feedbackNorm.includes("focus on the target") ||
    feedbackNorm.includes("instead of") ||
    feedbackSaysTargetMissing(feedback)
  );
}

function isMotifMismatch(
  target: string,
  detectedObject: string,
  feedback: string,
  targetMatch?: boolean
): boolean {
  return (
    targetMatch === false ||
    detectedObjectDiffersFromTarget(target, detectedObject) ||
    motifAppearsWrong(target, detectedObject, feedback) ||
    feedbackImpliesWrongTarget(feedback)
  );
}

function capScoreForMismatch(
  score: number,
  targetMatch: boolean | undefined,
  detectedObject: string,
  target: string,
  feedback: string
): number {
  const mismatch = isMotifMismatch(target, detectedObject, feedback, targetMatch);
  if (!mismatch) return score;

  if (feedbackSaysTargetMissing(feedback)) return Math.min(score, 25);
  const detectedNorm = normalizeText(detectedObject || "");
  if (
    detectedNorm.includes("scribble") ||
    detectedNorm.includes("random") ||
    detectedNorm.includes("blank") ||
    detectedNorm.includes("empty")
  ) {
    return Math.min(score, 20);
  }

  return Math.min(score, 30);
}

function parseTargetMatch(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const text = normalizeText(value);
    if (text === "true") return true;
    if (text === "false") return false;
  }
  return undefined;
}

const POSITIVE_WORDS = [
  "perfect", "great", "excellent", "lovely",
  "amazing", "very good", "nice", "well done",
  "clear", "recognizable",
];
const NEGATIVE_WORDS = [
  "not recognizable", "hard to recognize", "unclear",
  "does not look", "missing", "barely",
];

function reconcileScoreWithFeedback(
  score: number,
  feedback: string,
  targetMatch: boolean | undefined,
  detectedObject: string,
  target: string,
  artistMode: boolean
): number {
  const mismatch = isMotifMismatch(target, detectedObject, feedback, targetMatch);
  if (mismatch) return capScoreForMismatch(score, targetMatch, detectedObject, target, feedback);

  const text = (feedback || "").toLowerCase();

  // Always honor negative feedback.
  if (NEGATIVE_WORDS.some((w) => text.includes(w)) && score > 75) return 55;

  // Positive boost is only safe in casual mode AND when no problem language exists.
  if (artistMode) return score;
  if (targetMatch === false) return Math.min(score, 30);
  if (isProblemFeedback(feedback)) return score;
  if (POSITIVE_WORDS.some((w) => text.includes(w)) && score < 60) return 78;

  return score;
}

type JudgeFields = {
  score: number;
  recognition: number;
  shape: number;
  details: number;
  creativity: number;
  effort: number;
  targetMatch: boolean | undefined;
};

function capScoreByMode(result: JudgeFields, artistMode: boolean): JudgeFields {
  let { score, recognition, shape, details, creativity, effort, targetMatch } = result;

  if (targetMatch === false && score > 30) score = 30;

  if (artistMode) {
    if (effort <= 2 && creativity <= 2 && score > 70) score = 70;
    if (shape <= 2 && details <= 2 && score > 65) score = 65;
    if (recognition < 70 && score > 75) score = 75;
  }

  return { score, recognition, shape, details, creativity, effort, targetMatch };
}

function isValidCanvasAnalysis(value: unknown): value is CanvasAnalysis {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.changedPixelRatio === "number" &&
    typeof v.isBlank === "boolean" &&
    typeof v.colorVarietyBuckets === "number"
  );
}

function deriveDrawingQuality(analysis: CanvasAnalysis | null): DrawingQuality | undefined {
  if (!analysis) return undefined;
  const a = analysis as CanvasAnalysis & Partial<DrawingQuality>;
  if (
    typeof a.inkCoverage === "number" &&
    typeof a.boundingBoxCoverage === "number" &&
    typeof a.colorCount === "number" &&
    typeof a.usesColor === "boolean" &&
    typeof a.mostlyBlackLine === "boolean" &&
    typeof a.isTinyDrawing === "boolean" &&
    typeof a.isSparseDrawing === "boolean" &&
    typeof a.edgeComplexity === "number"
  ) {
    return {
      inkCoverage: a.inkCoverage,
      boundingBoxCoverage: a.boundingBoxCoverage,
      colorCount: a.colorCount,
      usesColor: a.usesColor,
      mostlyBlackLine: a.mostlyBlackLine,
      isTinyDrawing: a.isTinyDrawing,
      isSparseDrawing: a.isSparseDrawing,
      edgeComplexity: a.edgeComplexity,
    };
  }

  // Legacy clients send the smaller analysis shape. Derive what we can.
  const inkCoverage = analysis.changedPixelRatio;
  const bboxArea = analysis.bbox ? analysis.bbox.width * analysis.bbox.height : 0;
  const boundingBoxCoverage = bboxArea > 0 ? bboxArea / (768 * 768) : 0;
  return {
    inkCoverage,
    boundingBoxCoverage,
    colorCount: Math.max(0, analysis.colorVarietyBuckets - 2),
    usesColor: analysis.colorVarietyBuckets >= 4,
    mostlyBlackLine: analysis.colorVarietyBuckets < 4,
    isTinyDrawing: boundingBoxCoverage < 0.08,
    isSparseDrawing: inkCoverage < 0.015,
    edgeComplexity: 0,
  };
}

type OllamaResponse = { message?: { content?: string }; response?: string };

async function ollamaGenerate(prompt: string, images?: string[], temperature = 0.35): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        {
          role: "user",
          content: prompt,
          ...(images?.length ? { images } : {}),
        },
      ],
      options: { temperature },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Ollama failed ${response.status}: ${body}`);
  }

  const data = (await response.json()) as OllamaResponse;
  return String(data?.message?.content || data?.response || "");
}

function casualMotifPrompt(recentMotifs: string[], recentCategories: string[]): string {
  void recentCategories;
  return `You are choosing a drawing prompt for a fast party drawing game.

Choose ONE motif that is:
- fun to draw
- visually recognizable
- fair for mobile finger drawing
- drawable in 30-60 seconds
- not abstract
- not copyrighted
- not offensive
- not too repetitive

Avoid recently used motifs:
${recentMotifs.join(", ") || "(none yet)"}

Avoid boring repeats unless absolutely necessary:
apple, banana, book, key, ball, tree, house, car

Prefer playful visual motifs like:
rocket, cactus, ghost, robot, ice cream cone, sleeping cat, pirate ship, treasure chest, magic wand, rain cloud, tiny monster, hot air balloon.

Return JSON only:
{
  "name": "short motif name",
  "hint": "short visual hint",
  "difficulty": "easy|medium|hard",
  "category": "object|animal|food|nature|vehicle|place|fantasy|action|scene|emotion|composition|funny"
}`;
}

function artistMotifPrompt(recentMotifs: string[], recentCategories: string[]): string {
  return `You are choosing a drawing challenge for Artist Mode in an AI drawing game.

Artist Mode is for adults, artists, and advanced players.
Choose ONE motif that is still drawable, but more expressive and visually interesting.

Artist Mode randomness requirement:
- Prefer surprising and fresh prompts.
- Avoid repeating the same categories too often.
- Prefer harder visual ideas over simple objects.
- Favor prompts that reward composition, color, detail, and imagination.
- Good Artist Mode prompts often combine two ideas, e.g. "Clockwork Bird", "Cloud Library", "Dragon Teapot", "Neon Jellyfish".
- Do not choose plain beginner objects like "Book", "Cup", "Apple", "Key", "House", "Tree", "Car".
- If you choose a common object, transform it into something more original, e.g. "Crystal Teacup", "Floating Library", "Mechanical Flower".

Rules:
- Return JSON only.
- Do not choose recently used motifs.
- The prompt should reward composition, detail, color, perspective, and creativity.
- The prompt should still be recognizable.
- Avoid copyrighted characters, brands, celebrities, politics, sexual content, gore, hate, or medical content.
- Keep it drawable in 45-90 seconds.
- Use English.
- Name should be 1-5 words.
- Hint should be concrete and visual.

Recent motifs to avoid:
${recentMotifs.join(", ") || "(none yet)"}

Recent categories to avoid:
${recentCategories.join(", ") || "(none yet)"}

Good Artist Mode examples:
- "Melting Clock", hint: "soft clock bending over an edge"
- "Tiny Robot Cafe", hint: "small robot serving a cup"
- "Dragon Teapot", hint: "teapot shaped like a dragon"
- "Floating Island", hint: "small island with tree in the sky"
- "Neon Jellyfish", hint: "glowing jellyfish with long tentacles"
- "Rainy Street Lamp", hint: "lamp glowing in rain"
- "Crystal Mushroom", hint: "mushroom made of shiny crystals"
- "Space Turtle", hint: "turtle floating with stars"
- "Cozy Wizard Desk", hint: "desk with hat, candle, and book"
- "Clockwork Bird", hint: "bird with gears and wings"
- "Moonlit Lighthouse", hint: "lighthouse under moon and waves"
- "Cyberpunk Flower", hint: "flower with wires and neon petals"
- "Origami Dragon", hint: "paper dragon with folded wings"
- "Ghost Orchestra", hint: "ghosts playing tiny instruments"
- "Underwater Castle", hint: "castle with bubbles and fish"

Bad Artist Mode examples:
- "Apple"
- "Book"
- "Banana"
- "Key"
- "Happiness"
- "Cool thing"
- "Spider-Man"
- "Minecraft"
- "Taylor Swift"

Return exactly:
{
  "name": "motif name",
  "hint": "short visual hint",
  "difficulty": "artist",
  "category": "scene|composition|fantasy|object|animal|nature|funny"
}`;
}

function seedToResponse(seed: MotifSeed, artistMode: boolean, source: string) {
  return {
    name: seed.name,
    hint: seed.hint,
    difficulty: seed.difficulty,
    category: seed.category,
    artistMode,
    source,
    model: OLLAMA_MODEL,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ollamaUrl: OLLAMA_URL, model: OLLAMA_MODEL });
});

app.post("/api/motif", async (req, res) => {
  const artistMode = Boolean(req.body?.artistMode);
  const recentMotifs = Array.isArray(req.body?.recentMotifs)
    ? (req.body.recentMotifs as unknown[]).filter((m): m is string => typeof m === "string").slice(0, 24)
    : [];
  const recentCategories = Array.isArray(req.body?.recentCategories)
    ? (req.body.recentCategories as unknown[]).filter((c): c is string => typeof c === "string").slice(0, 8)
    : [];

  try {
    const prompt = artistMode
      ? artistMotifPrompt(recentMotifs, recentCategories)
      : casualMotifPrompt(recentMotifs, recentCategories);
    const text = await ollamaGenerate(prompt, undefined, artistMode ? 0.9 : 0.65);
    const parsed = extractJson(text) as Record<string, unknown> | null;

    if (parsed) {
      const candidate = {
        name: typeof parsed.name === "string" ? parsed.name.trim() : "",
        hint: typeof parsed.hint === "string" ? parsed.hint.trim() : "",
        difficulty:
          artistMode && parsed.difficulty == null ? "artist" : parsed.difficulty,
        category: parsed.category,
      };

      if (isValidMotif(candidate, { recentMotifs, artistMode })) {
        const difficulty = (
          artistMode ? "artist" : candidate.difficulty
        ) as MotifDifficulty;
        const category = candidate.category as MotifCategory;
        res.json({
          name: candidate.name.slice(0, 40),
          hint: candidate.hint.slice(0, 100),
          difficulty,
          category,
          artistMode,
          source: "ollama",
          model: OLLAMA_MODEL,
        });
        return;
      }
    }
  } catch (error) {
    console.warn("[motif] Ollama fallback:", error);
  }

  const fallback = pickFallbackMotif({ recentMotifs, recentCategories, artistMode });
  res.json(seedToResponse(fallback, artistMode, "fallback"));
});

const CASUAL_JUDGE_PROMPT = `You are judging a casual drawing game.

Target motif: "__MOTIF__"

Prioritize whether the target motif is recognizable.
A simple drawing can score high if it clearly matches the motif.
Wrong motif is capped at 30.

Return JSON only:
{
  "detectedObject": "what the drawing shows",
  "targetMatch": true,
  "score": 0,
  "recognition": 0,
  "shape": 1,
  "proportion": 1,
  "creativity": 1,
  "effort": 1,
  "feedback": "short friendly feedback"
}

Scale:
- score: integer 0-100
- recognition: integer 0-100
- shape/proportion/creativity/effort: integer 1-5
- targetMatch: true only if the target motif is clearly recognizable

Casual scoring:
- Wrong motif: 0-30
- Empty/random: 0-20
- Target somewhat recognizable: 40-69
- Target clearly recognizable: 70-89
- Target very clear and well drawn: 90-100

Keep feedback under 18 words.`;

const ARTIST_JUDGE_PROMPT = `You are judging Artist Mode in a drawing game.

Target motif: "__MOTIF__"

Artist Mode is strict and intended for adults, artists, and advanced players.

You must judge two things:
1. Does the drawing match the target motif?
2. How strong is the drawing as an artwork?

Important:
Do NOT give high scores just because the target is recognizable.
A rough scribble, simple line, or basic outline should not score high in Artist Mode.
A simple outline of the correct object is usually 35-60.
A clean outline with correct shape and proportions is usually 55-70.
A drawing with color, details, composition, shading, and polish can score 75-89.
Only polished, expressive, detailed drawings should receive 90-100.

Be critical:
- If the drawing is messy, shaky, very sparse, unfinished, or low effort, reduce the score.
- If there is no color and no detail, do not give 90+.
- If proportions are weak, do not give 80+.
- If it is only a quick sketch, do not call it amazing.
- Do not praise details that are not actually visible.
- Do not say "perfect" unless it is genuinely polished.

Return JSON only:
{
  "detectedObject": "what the drawing shows",
  "targetMatch": true,
  "score": 0,
  "recognition": 0,
  "shape": 1,
  "proportion": 1,
  "details": 1,
  "color": 1,
  "composition": 1,
  "creativity": 1,
  "effort": 1,
  "polish": 1,
  "feedback": "short honest friendly feedback"
}

Scale:
- score: 0-100
- recognition: 0-100
- all other ratings: 1-5

Artist Mode scoring guide:
- Wrong motif: 0-30 max
- Empty/tiny/random: 0-20
- Correct but messy/simple scribble: 25-45
- Correct but very basic outline: 40-60
- Correct clean outline, no color/details: 55-70
- Correct with some color/details: 65-78
- Correct with strong detail, color, composition: 78-89
- Excellent polished artwork: 90-100

Hard rules:
- No 90+ unless color >= 3, details >= 4, effort >= 4, polish >= 4, and recognition >= 85.
- No 85+ unless shape >= 4 and proportion >= 4.
- No 80+ if the drawing is only black line art with no meaningful detail.
- No 75+ if effort <= 2 or polish <= 2.
- No 70+ if details <= 2.
- Wrong motif is always max 30.

Feedback:
- Be friendly but honest.
- If it is rough, say what to improve.
- Example: "The book is recognizable, but Artist Mode expects cleaner proportions, more details, and stronger finish."`;

app.post("/api/judge", async (req, res) => {
  const motif = String(req.body?.motif || "Object");
  const actionCount = clampInt(req.body?.actionCount ?? req.body?.strokeCount ?? 0, 0, 500);
  const artistMode = Boolean(req.body?.artistMode);
  const imageBase64 = String(req.body?.imageBase64 || "");
  const imageForOllama = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const rawAnalysis = req.body?.canvasAnalysis ?? req.body?.imageStats;
  const analysis = isValidCanvasAnalysis(rawAnalysis) ? rawAnalysis : null;

  // Blank guard: never ask the model about an empty canvas.
  if (analysis?.isBlank) {
    res.json({
      score: 0,
      recognition: 0,
      shape: 0,
      details: 0,
      creativity: 0,
      effort: 0,
      feedback: "No drawing submitted.",
      detectedObject: "blank",
      targetMatch: false,
      source: "local",
      judgeMode: "blank",
      artistMode,
      model: OLLAMA_MODEL,
    });
    return;
  }

  try {
    if (!imageForOllama) throw new Error("No image received");

    const promptTemplate = artistMode ? ARTIST_JUDGE_PROMPT : CASUAL_JUDGE_PROMPT;
    const prompt = promptTemplate.replace("__MOTIF__", motif);
    const text = await ollamaGenerate(prompt, [imageForOllama]);

    const parsed = extractJson(text) as
      | {
          score?: unknown;
          recognition?: unknown;
          shape?: unknown;
          details?: unknown;
          proportion?: unknown;
          color?: unknown;
          composition?: unknown;
          polish?: unknown;
          creativity?: unknown;
          effort?: unknown;
          feedback?: unknown;
          detectedObject?: unknown;
          targetMatch?: unknown;
        }
      | null;
    if (!parsed) throw new Error("No JSON from Ollama judge");

    const rawScore = normalizeScore(parsed.score);
    let score = rawScore;
    let recognition = normalizeScore(parsed.recognition ?? parsed.score);
    let shape = normalizeRating(parsed.shape);
    let proportion = normalizeRating(parsed.proportion ?? parsed.details);
    let details = parsed.details != null
      ? normalizeRating(parsed.details)
      : proportion;
    let color = parsed.color != null ? normalizeRating(parsed.color) : 1;
    let composition = parsed.composition != null ? normalizeRating(parsed.composition) : 2;
    let creativity = normalizeRating(parsed.creativity);
    const effort = normalizeRating(parsed.effort);
    let polish = parsed.polish != null ? normalizeRating(parsed.polish) : effort;
    const detectedObject = typeof parsed.detectedObject === "string"
      ? parsed.detectedObject.slice(0, 80)
      : "";
    let targetMatch = parseTargetMatch(parsed.targetMatch);
    const rawFeedback = typeof parsed.feedback === "string" ? parsed.feedback : "";
    let feedback = (rawFeedback || feedbackForScore(score)).slice(0, 140);
    score = reconcileScoreWithFeedback(score, feedback, targetMatch, detectedObject, motif, artistMode);
    score = capScoreForMismatch(score, targetMatch, detectedObject, motif, feedback);

    const mismatch = isMotifMismatch(motif, detectedObject, feedback, targetMatch);
    if (mismatch) {
      targetMatch = false;
      if (!feedbackImpliesWrongTarget(feedback)) {
        feedback = `Nice drawing, but the target was ${motif.toLowerCase()}.`;
      }
      score = capScoreForMismatch(score, targetMatch, detectedObject, motif, feedback);
      recognition = Math.min(recognition, 25);
      shape = Math.min(shape, 2);
      proportion = Math.min(proportion, 2);
      details = Math.min(details, 2);
      color = Math.min(color, 1);
      composition = Math.min(composition, 2);
      polish = Math.min(polish, 2);
      creativity = Math.min(creativity, 3);
    } else if (targetMatch === undefined) {
      targetMatch = score >= 70 && recognition >= 70;
    }

    const capped = capScoreByMode(
      { score, recognition, shape, details: proportion, creativity, effort, targetMatch },
      artistMode
    );

    const drawingQuality = deriveDrawingQuality(analysis);

    // FINAL guard — last word on the score, after all parsing / normalization /
    // feedback reconciliation / mismatch caps / mode caps. Bypassing this is a bug.
    const breakdown = applyFinalScoreGuardsWithBreakdown({
      score: capped.score,
      recognition: capped.recognition,
      shape: capped.shape,
      proportion,
      details,
      color,
      composition,
      creativity: capped.creativity,
      effort: capped.effort,
      polish,
      feedback,
      targetMatch: capped.targetMatch,
      detectedObject,
      targetMotif: motif,
      artistMode,
      judgeMode: "vision",
      drawingQuality,
    });
    const finalScore = breakdown.finalScore;
    feedback = sanitizeArtistFeedback(feedback, finalScore, artistMode);

    console.log("[judge]", {
      rawModelScore: rawScore,
      weightedScore: breakdown.weightedScore,
      maxCap: breakdown.maxCap,
      finalScore,
      textureOffset: breakdown.textureOffset,
      artistMode,
      ratings: {
        recognition: capped.recognition,
        shape: capped.shape,
        proportion,
        details,
        color,
        composition,
        creativity: capped.creativity,
        effort: capped.effort,
        polish,
      },
      targetMatch: capped.targetMatch,
      judgeMode: "vision",
      drawingQuality,
    });

    res.json({
      score: finalScore,
      recognition: capped.recognition,
      shape: capped.shape,
      proportion,
      details, // legacy alias for older frontends
      color,
      composition,
      polish,
      creativity: capped.creativity,
      effort: capped.effort,
      feedback,
      detectedObject,
      targetMatch: capped.targetMatch,
      source: "ollama",
      model: OLLAMA_MODEL,
      judgeMode: "vision",
      artistMode,
    });
    return;
  } catch (error) {
    console.warn("[judge] Ollama vision fallback:", error);
  }

  // Honest fallback: based on canvas analysis + action count. Mode-aware cap
  // applied first, then the final guard runs as the last word.
  const heuristic = fallbackScoreFromCanvasAnalysis(analysis, actionCount);
  const fallbackCap = artistMode ? 60 : 70;
  const preGuardScore = Math.min(heuristic.score, fallbackCap);
  const fallbackFeedback = "Fallback score used. Motif match could not be fully verified.";

  const drawingQuality = deriveDrawingQuality(analysis);

  const breakdown = applyFinalScoreGuardsWithBreakdown({
    score: preGuardScore,
    recognition: Math.min(heuristic.recognition, fallbackCap),
    shape: heuristic.shape,
    proportion: heuristic.details,
    details: heuristic.details,
    color: drawingQuality?.usesColor ? 2 : 1,
    composition: 2,
    creativity: heuristic.creativity,
    effort: heuristic.effort,
    polish: heuristic.effort,
    feedback: fallbackFeedback,
    targetMatch: undefined,
    detectedObject: "unverified",
    targetMotif: motif,
    artistMode,
    judgeMode: "fallback",
    drawingQuality,
  });
  const finalScore = breakdown.finalScore;

  console.log("[judge]", {
    rawModelScore: heuristic.score,
    weightedScore: breakdown.weightedScore,
    maxCap: breakdown.maxCap,
    finalScore,
    textureOffset: breakdown.textureOffset,
    artistMode,
    ratings: {
      recognition: Math.min(heuristic.recognition, fallbackCap),
      shape: heuristic.shape,
      proportion: heuristic.details,
      details: heuristic.details,
      creativity: heuristic.creativity,
      effort: heuristic.effort,
    },
    targetMatch: undefined,
    judgeMode: "fallback",
    drawingQuality,
  });

  res.json({
    score: finalScore,
    recognition: Math.min(heuristic.recognition, fallbackCap),
    shape: heuristic.shape,
    proportion: heuristic.details,
    details: heuristic.details, // legacy alias for older frontends
    color: drawingQuality?.usesColor ? 2 : 1,
    composition: 2,
    polish: heuristic.effort,
    creativity: heuristic.creativity,
    effort: heuristic.effort,
    feedback: fallbackFeedback,
    detectedObject: "unverified",
    targetMatch: undefined,
    source: "fallback",
    model: OLLAMA_MODEL,
    judgeMode: "fallback",
    artistMode,
  });
});

// Suppress unused-import warning if validation only used in scope.
void isBoringMotif;
void isUnsafeMotif;

const selfTest = runJudgeGuardSelfTest();
if (selfTest.pass) {
  console.log(selfTest.report);
} else {
  console.error(selfTest.report);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`[sketch-judge-api] http://127.0.0.1:${port}`);
  console.log(`[sketch-judge-api] Ollama: ${OLLAMA_URL} | model: ${OLLAMA_MODEL}`);
});
