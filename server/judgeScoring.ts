export type ScoreGuardJudgeMode = "vision" | "text-only" | "fallback";

export type DrawingQuality = {
  inkCoverage: number;
  boundingBoxCoverage: number;
  colorCount: number;
  usesColor: boolean;
  mostlyBlackLine: boolean;
  isTinyDrawing: boolean;
  isSparseDrawing: boolean;
  edgeComplexity: number;
};

export type ScoreGuardInput = {
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
  targetMatch?: boolean;
  detectedObject?: string;
  targetMotif: string;
  artistMode: boolean;
  judgeMode: ScoreGuardJudgeMode;
  drawingQuality?: DrawingQuality;
};

export type ScoreGuardBreakdown = {
  rawModelScore: number;
  weightedScore: number;
  maxCap: number;
  finalScore: number;
  textureOffset: number;
};

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function ratingToPercent(value: number): number {
  const r = Math.max(1, Math.min(5, value));
  return r * 20;
}

function qualityCurve(value: number, low: number, high: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= low) return 0;
  if (value >= high) return 1;
  return (value - low) / (high - low);
}

// --- feedback phrase tiers ---

const SEVERE_PHRASES = [
  "scribble",
  "messy",
  "unfinished",
  "hard to recognize",
  "not recognizable",
];

const SOFT_PROBLEM_PHRASES = [
  "simple line",
  "simple outline",
  "rough sketch",
  "rough outline",
  "rough",
  "basic outline",
  "shaky",
  "sparse",
  "too simple",
  "lacks detail",
  "needs detail",
  "needs details",
  "needs more detail",
  "more detail",
  "add detail",
  "add details",
  "add color",
  "no color",
  "needs color",
  "needs more color",
  "more color",
  "weak proportion",
  "proportions are off",
  "needs stronger proportions",
  "proportion could improve",
  "missing handle",
  "missing curves",
  "missing",
  "could be cleaner",
  "more polish",
  "low effort",
  "lacks creativity",
  "needs more creativity",
  "only outline",
  "just outline",
];

// Mild phrases — "simple" alone can still be a decent artist drawing, just not 90+.
const MILD_PROBLEM_PHRASES = [
  "simple",
  "basic",
  "minimal",
  "plain",
  "very simple",
  "clear and simple",
];

const VERY_CLEAR_SIMPLE_PHRASES = ["very clear and simple"];

const WRONG_PHRASES = [
  "wrong motif",
  "target was",
  "not the target",
  "focus on the target",
];

function containsAny(haystack: string, phrases: string[]): boolean {
  for (const p of phrases) {
    if (haystack.includes(p)) return true;
  }
  return false;
}

export function isSevereProblemFeedback(feedback: string): boolean {
  return containsAny((feedback ?? "").toLowerCase(), SEVERE_PHRASES);
}

export function isMildProblemFeedback(feedback: string): boolean {
  return containsAny((feedback ?? "").toLowerCase(), MILD_PROBLEM_PHRASES);
}

export function isVeryClearSimpleFeedback(feedback: string): boolean {
  return containsAny((feedback ?? "").toLowerCase(), VERY_CLEAR_SIMPLE_PHRASES);
}

export function isProblemFeedback(feedback: string): boolean {
  const text = (feedback ?? "").toLowerCase();
  return (
    containsAny(text, SEVERE_PHRASES) ||
    containsAny(text, SOFT_PROBLEM_PHRASES) ||
    containsAny(text, MILD_PROBLEM_PHRASES) ||
    containsAny(text, WRONG_PHRASES)
  );
}

// --- weighted judge score ---

export function computeArtistWeightedScore(input: ScoreGuardInput): number {
  const recognition = clampScore(input.recognition);
  const shape = ratingToPercent(input.shape);
  const proportionRating = input.proportion ?? input.details ?? 1;
  const proportion = ratingToPercent(proportionRating);
  const details = ratingToPercent(input.details ?? input.proportion ?? 1);
  const color = ratingToPercent(input.color ?? 1);
  const composition = ratingToPercent(input.composition ?? 2);
  const creativity = ratingToPercent(input.creativity);
  const effort = ratingToPercent(input.effort);
  const polish = ratingToPercent(input.polish ?? input.effort);

  // Weights spec'd in Part 5 — proportion and creativity weigh more than recognition
  // so weak visible ratings can actually pull the score down meaningfully.
  let score =
    recognition * 0.18 +
    shape * 0.14 +
    proportion * 0.16 +
    details * 0.13 +
    color * 0.08 +
    composition * 0.08 +
    creativity * 0.13 +
    effort * 0.06 +
    polish * 0.04;

  const q = input.drawingQuality;
  if (q) {
    const coverageBonus = qualityCurve(q.boundingBoxCoverage, 0.08, 0.35) * 6;
    const inkBonus = qualityCurve(q.inkCoverage, 0.012, 0.08) * 5;
    const colorBonus = q.usesColor ? Math.min(5, q.colorCount * 0.8) : -5;
    const detailBonus = qualityCurve(q.edgeComplexity, 0.05, 0.22) * 5;

    score += coverageBonus + inkBonus + colorBonus + detailBonus;

    if (q.isTinyDrawing) score -= 12;
    if (q.isSparseDrawing) score -= 10;
    if (q.mostlyBlackLine && !q.usesColor) score -= 6;
  }

  // Visible weakness penalty — applied AFTER the rating sum, so individual weak
  // visible categories hurt more than their weighted share already does.
  const visibleRatings = [
    input.shape,
    proportionRating,
    input.creativity,
    input.effort,
  ];
  const visiblePenalty = visibleRatings.reduce((penalty, rating) => {
    if (rating <= 1) return penalty + 12;
    if (rating <= 2) return penalty + 8;
    if (rating <= 3) return penalty + 3;
    return penalty;
  }, 0);
  score -= visiblePenalty;

  // Recognition floor: when the target is matched and there's some effort on shape,
  // a recognizable drawing should not feel humiliating in Artist Mode. Keeps the
  // observed open-book case in the 60-70 range instead of dropping into the 50s.
  if (
    input.targetMatch !== false &&
    input.shape >= 3 &&
    input.effort >= 3 &&
    recognition >= 80
  ) {
    score = Math.max(score, 50);
  }

  if (input.targetMatch === false) {
    score = Math.min(score, 28);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function computeCasualWeightedScore(input: ScoreGuardInput): number {
  const recognition = clampScore(input.recognition);
  const shape = ratingToPercent(input.shape);
  const proportion = ratingToPercent(input.proportion ?? input.details ?? 3);
  const creativity = ratingToPercent(input.creativity);
  const effort = ratingToPercent(input.effort);

  let score =
    recognition * 0.50 +
    shape * 0.18 +
    proportion * 0.12 +
    creativity * 0.08 +
    effort * 0.12;

  const q = input.drawingQuality;
  if (q) {
    if (q.isTinyDrawing) score -= 8;
    if (q.isSparseDrawing) score -= 6;
    if (q.usesColor) score += 3;
  }

  if (input.targetMatch === false) {
    score = Math.min(score, 28);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

// --- max cap (ceiling) ---

export function computeMaxCap(input: ScoreGuardInput): number {
  let cap = 100;

  const feedback = (input.feedback ?? "").toLowerCase();
  const proportion = input.proportion ?? input.details ?? 1;
  const details = input.details ?? proportion;
  const color = input.color ?? 1;
  const polish = input.polish ?? input.effort;

  const problem = containsAny(feedback, SOFT_PROBLEM_PHRASES);
  const severeProblem = isSevereProblemFeedback(feedback);
  const mildProblem = isMildProblemFeedback(feedback);
  const veryClearSimple = isVeryClearSimpleFeedback(feedback);
  const wrongMotif =
    input.targetMatch === false || containsAny(feedback, WRONG_PHRASES);

  if (wrongMotif) cap = Math.min(cap, 30);

  if (input.judgeMode === "fallback") {
    cap = Math.min(cap, input.artistMode ? 55 : 70);
  }

  if (!input.artistMode) {
    return cap;
  }

  if (input.recognition < 50) cap = Math.min(cap, 45);
  if (input.recognition < 70) cap = Math.min(cap, 60);

  // Per-rating caps — kept but slightly loosened so the visible-rating
  // consistency block below can do the precise tuning.
  if (input.shape <= 2) cap = Math.min(cap, 60);
  if (details <= 2) cap = Math.min(cap, 70);
  if (input.creativity <= 2) cap = Math.min(cap, 75);
  if (input.effort <= 2) cap = Math.min(cap, 65);
  if (polish <= 2) cap = Math.min(cap, 70);
  if (color <= 1) cap = Math.min(cap, 82);

  if (input.shape <= 2 && proportion <= 2) cap = Math.min(cap, 58);
  if (details <= 2 && input.effort <= 2) cap = Math.min(cap, 60);
  if (input.creativity <= 2 && polish <= 2) cap = Math.min(cap, 62);

  // --- Visible-rating consistency caps (Part 1) ---
  // The four ratings the user actually sees in the UI must be mathematically
  // consistent with the final score.
  const visibleRatings = [
    input.shape,
    proportion,
    input.creativity,
    input.effort,
  ];
  const minVisibleRating = Math.min(...visibleRatings);
  const avgVisibleRating =
    visibleRatings.reduce((sum, value) => sum + value, 0) / visibleRatings.length;
  const lowVisibleCount = visibleRatings.filter((v) => v <= 2).length;

  if (minVisibleRating <= 1) cap = Math.min(cap, 58);
  if (lowVisibleCount >= 1) cap = Math.min(cap, 82);
  if (lowVisibleCount >= 2) cap = Math.min(cap, 74);
  if (avgVisibleRating < 3.0) cap = Math.min(cap, 68);
  if (avgVisibleRating < 3.5) cap = Math.min(cap, 78);

  // Visible-only top-score gates (Part 1). 90+ requires all four visible
  // ratings ≥4. 85+ requires shape≥4, proportion≥3, creativity≥3, effort≥4.
  if (
    input.shape < 4 ||
    proportion < 4 ||
    input.creativity < 4 ||
    input.effort < 4
  ) {
    cap = Math.min(cap, 89);
  }
  if (
    input.shape < 4 ||
    proportion < 3 ||
    input.creativity < 3 ||
    input.effort < 4
  ) {
    cap = Math.min(cap, 84);
  }

  const q = input.drawingQuality;
  if (q) {
    if (q.isTinyDrawing) cap = Math.min(cap, 35);
    if (q.isSparseDrawing) cap = Math.min(cap, 45);
    if (q.mostlyBlackLine && !q.usesColor) cap = Math.min(cap, 75);
    if (q.mostlyBlackLine && details <= 2) cap = Math.min(cap, 70);
    if (!q.usesColor) cap = Math.min(cap, 80);
    if (q.colorCount <= 1) cap = Math.min(cap, 80);
    if (q.inkCoverage < 0.012) cap = Math.min(cap, 45);
    if (q.boundingBoxCoverage < 0.08) cap = Math.min(cap, 40);
  }

  if (severeProblem) cap = Math.min(cap, 50);
  else if (problem) cap = Math.min(cap, 60);

  // Mild feedback tier ("simple"/"basic"/"minimal"/"plain") — still capped
  // but at a more reasonable level since "simple" can still be a decent
  // recognizable drawing, just not 90+.
  if (veryClearSimple) cap = Math.min(cap, 74);
  else if (mildProblem) cap = Math.min(cap, 76);

  const overpraised =
    feedback.includes("perfectly captured") ||
    feedback.includes("perfect") ||
    feedback.includes("amazing") ||
    feedback.includes("incredible") ||
    feedback.includes("masterful");
  if (overpraised && (input.shape <= 3 || proportion <= 3 || input.effort <= 3 || polish <= 3)) {
    cap = Math.min(cap, 70);
  }

  // Existing rich top-score ladder gates — still useful as additional bounds
  // on color/details/recognition that the visible-only gates don't see.
  if (
    input.recognition < 75 ||
    input.shape < 3 ||
    proportion < 3 ||
    details < 3 ||
    input.effort < 3 ||
    polish < 3
  ) {
    cap = Math.min(cap, 74);
  }

  if (
    input.recognition < 85 ||
    input.shape < 4 ||
    proportion < 4 ||
    details < 4 ||
    input.effort < 4 ||
    polish < 4 ||
    color < 3
  ) {
    cap = Math.min(cap, 84);
  }

  if (
    input.recognition < 90 ||
    input.shape < 5 ||
    proportion < 4 ||
    details < 4 ||
    input.effort < 5 ||
    polish < 5 ||
    color < 3
  ) {
    cap = Math.min(cap, 89);
  }

  if (
    input.recognition < 95 ||
    input.shape !== 5 ||
    proportion < 5 ||
    details < 5 ||
    input.creativity < 4 ||
    input.effort !== 5 ||
    polish !== 5 ||
    color < 4
  ) {
    cap = Math.min(cap, 94);
  }

  return cap;
}

// --- deterministic texture ---

export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildTextureSeed(input: ScoreGuardInput): string {
  const q = input.drawingQuality;
  return [
    input.targetMotif,
    input.artistMode ? "artist" : "casual",
    input.targetMatch === false ? "miss" : "match",
    Math.round(input.recognition),
    input.shape,
    input.proportion ?? input.details ?? 0,
    input.details ?? 0,
    input.color ?? 0,
    input.creativity,
    input.effort,
    input.polish ?? input.effort,
    q ? Math.round(q.inkCoverage * 10000) : 0,
    q ? Math.round(q.boundingBoxCoverage * 10000) : 0,
    q ? q.colorCount : 0,
    q ? Math.round(q.edgeComplexity * 10000) : 0,
    input.judgeMode,
  ].join("|");
}

export function applyDeterministicScoreTexture(
  score: number,
  input: ScoreGuardInput,
  maxCap: number
): { score: number; offset: number } {
  const seed = buildTextureSeed(input);
  const hash = stableHash(seed);

  // Range -3..+3.
  const baseOffset = (hash % 7) - 3;

  let metricOffset = 0;
  const q = input.drawingQuality;
  if (q) {
    if (q.usesColor) metricOffset += 1;
    if (q.edgeComplexity > 0.18) metricOffset += 1;
    if (q.isSparseDrawing) metricOffset -= 2;
    if (q.isTinyDrawing) metricOffset -= 2;
  }

  let textured = score + baseOffset + metricOffset;

  // Avoid suspiciously round buckets in the mid-range.
  if (textured % 10 === 0 && textured > 20 && textured < 98) {
    textured += hash % 2 === 0 ? 1 : -1;
  }

  // Never exceed the cap.
  textured = Math.min(textured, maxCap);

  // If the cap itself is a hard bucket and the score landed exactly there,
  // nudge it down slightly so it does not feel mechanical. Skip when cap is
  // 100 or wrong-motif cap (30) — both should remain expressible exactly.
  if (textured === maxCap && maxCap < 100 && maxCap > 30) {
    textured -= 1 + (hash % 3); // -1..-3
  }

  textured = clampScore(textured);
  return { score: textured, offset: textured - score };
}

// --- main guard ---

export function applyFinalScoreGuardsWithBreakdown(input: ScoreGuardInput): ScoreGuardBreakdown {
  const rawModelScore = clampScore(input.score);
  const weightedScore = input.artistMode
    ? computeArtistWeightedScore(input)
    : computeCasualWeightedScore(input);

  const blended = input.artistMode
    ? rawModelScore * 0.35 + weightedScore * 0.65
    : rawModelScore * 0.55 + weightedScore * 0.45;

  const maxCap = computeMaxCap(input);
  const beforeTexture = Math.min(Math.round(blended), maxCap);
  const textured = applyDeterministicScoreTexture(beforeTexture, input, maxCap);

  return {
    rawModelScore,
    weightedScore,
    maxCap,
    finalScore: textured.score,
    textureOffset: textured.offset,
  };
}

export function applyFinalScoreGuards(input: ScoreGuardInput): number {
  return applyFinalScoreGuardsWithBreakdown(input).finalScore;
}

// --- feedback sanitization ---

const OVERPRAISE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bperfectly\b/gi, "clearly"],
  [/\bperfect\b/gi, "clear"],
  [/\bamazing\b/gi, "good"],
  [/\bexcellent\b/gi, "solid"],
  [/\bmasterpiece\b/gi, "drawing"],
  [/\bincredible\b/gi, "solid"],
  [/\bmasterful\b/gi, "competent"],
];

const TONE_DOWN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bGreat job!?/g, "Good start!"],
  [/\bgreat job!?/g, "good start!"],
  [/\bStrong work!?/g, "Nice try!"],
  [/\bstrong work!?/g, "nice try!"],
];

export function sanitizeArtistFeedback(
  feedback: string,
  finalScore: number,
  artistMode: boolean
): string {
  if (!artistMode) return feedback;
  let result = feedback ?? "";

  if (finalScore < 85) {
    for (const [pattern, replacement] of OVERPRAISE_REPLACEMENTS) {
      result = result.replace(pattern, replacement);
    }
  }

  if (finalScore < 75) {
    for (const [pattern, replacement] of TONE_DOWN_REPLACEMENTS) {
      result = result.replace(pattern, replacement);
    }
  }

  return result;
}

// --- self-tests ---

type SelfTestCase = {
  label: string;
  input: ScoreGuardInput;
  expect: (final: number) => boolean;
  expectDescription: string;
};

const SELF_TEST_CASES: SelfTestCase[] = [
  {
    label: "Case 1: artist simple-line bug must cap <= 55",
    input: {
      score: 100,
      recognition: 80,
      shape: 1,
      proportion: 1,
      details: 1,
      color: 1,
      creativity: 1,
      effort: 2,
      polish: 2,
      feedback:
        "It's a simple line! Remember that cups need curves and a handle to be recognizable.",
      targetMatch: true,
      detectedObject: "line",
      targetMotif: "Cup",
      artistMode: true,
      judgeMode: "vision",
    },
    expect: (final) => final <= 55,
    expectDescription: "<= 55",
  },
  {
    label: "Case 2: artist polished perfect drawing >= 95",
    input: {
      score: 100,
      recognition: 95,
      shape: 5,
      proportion: 5,
      details: 5,
      color: 4,
      composition: 5,
      creativity: 5,
      effort: 5,
      polish: 5,
      feedback: "Polished, detailed, and clearly recognizable.",
      targetMatch: true,
      detectedObject: "cup",
      targetMotif: "Cup",
      artistMode: true,
      judgeMode: "vision",
    },
    expect: (final) => final >= 95,
    expectDescription: ">= 95 (perfect can keep ~100)",
  },
  {
    label: "Case 3: artist wrong motif must cap <= 30",
    input: {
      score: 100,
      recognition: 80,
      shape: 4,
      proportion: 4,
      details: 4,
      color: 4,
      composition: 4,
      creativity: 4,
      effort: 4,
      polish: 4,
      feedback: "Nice apple, but the target was a book.",
      targetMatch: false,
      detectedObject: "apple",
      targetMotif: "Book",
      artistMode: true,
      judgeMode: "vision",
    },
    expect: (final) => final <= 30,
    expectDescription: "<= 30",
  },
  {
    label: "Case 4: casual forgiving with mid ratings stays high",
    input: {
      score: 85,
      recognition: 90,
      shape: 3,
      proportion: 3,
      details: 3,
      color: 2,
      creativity: 2,
      effort: 2,
      polish: 2,
      feedback: "Clearly a cup, well recognizable.",
      targetMatch: true,
      detectedObject: "cup",
      targetMotif: "Cup",
      artistMode: false,
      judgeMode: "vision",
    },
    expect: (final) => final >= 70,
    expectDescription: ">= 70",
  },
  {
    label: "Case 5: artist fallback caps at 55",
    input: {
      score: 95,
      recognition: 80,
      shape: 3,
      proportion: 3,
      details: 3,
      color: 1,
      creativity: 3,
      effort: 3,
      polish: 3,
      feedback: "Fallback score used. Motif match could not be fully verified.",
      targetMatch: undefined,
      detectedObject: "unverified",
      targetMotif: "Cup",
      artistMode: true,
      judgeMode: "fallback",
    },
    expect: (final) => final <= 55,
    expectDescription: "<= 55",
  },
  {
    label: "Case A: artist 'open book' overpraise + bad scribble must cap <= 60",
    input: {
      score: 90,
      recognition: 95,
      shape: 3,
      proportion: 3,
      details: 2,
      color: 1,
      composition: 2,
      creativity: 2,
      effort: 2,
      polish: 2,
      feedback:
        "Great job! You perfectly captured the open book shape and details. Very neat drawing!",
      targetMatch: true,
      detectedObject: "open book",
      targetMotif: "Book",
      artistMode: true,
      judgeMode: "vision",
      drawingQuality: {
        inkCoverage: 0.008,
        boundingBoxCoverage: 0.18,
        colorCount: 0,
        usesColor: false,
        mostlyBlackLine: true,
        isTinyDrawing: false,
        isSparseDrawing: true,
        edgeComplexity: 0.1,
      },
    },
    expect: (final) => final <= 60,
    expectDescription: "<= 60",
  },
  {
    label: "Case B: artist clean outline, no color/details, caps <= 70",
    input: {
      score: 90,
      recognition: 90,
      shape: 4,
      proportion: 4,
      details: 2,
      color: 1,
      composition: 3,
      creativity: 3,
      effort: 3,
      polish: 3,
      feedback: "Clean outline, but it needs more detail and color.",
      targetMatch: true,
      detectedObject: "cup",
      targetMotif: "Cup",
      artistMode: true,
      judgeMode: "vision",
    },
    expect: (final) => final <= 70,
    expectDescription: "<= 70",
  },
  {
    label: "Case C: artist polished, detailed, recognizable stays >= 85",
    input: {
      score: 95,
      recognition: 92,
      shape: 5,
      proportion: 4,
      details: 4,
      color: 3,
      composition: 4,
      creativity: 4,
      effort: 5,
      polish: 5,
      feedback: "Detailed, polished, recognizable, and expressive.",
      targetMatch: true,
      detectedObject: "cup",
      targetMotif: "Cup",
      artistMode: true,
      judgeMode: "vision",
    },
    expect: (final) => final >= 85,
    expectDescription: ">= 85 (texture may move within band)",
  },
  {
    label: "Case D: casual same rough drawing as A keeps casual range",
    input: {
      score: 80,
      recognition: 90,
      shape: 3,
      proportion: 3,
      details: 2,
      color: 1,
      composition: 2,
      creativity: 2,
      effort: 2,
      polish: 2,
      feedback:
        "Great job! You captured the open book shape. Very neat drawing!",
      targetMatch: true,
      detectedObject: "open book",
      targetMotif: "Book",
      artistMode: false,
      judgeMode: "vision",
      drawingQuality: {
        inkCoverage: 0.008,
        boundingBoxCoverage: 0.18,
        colorCount: 0,
        usesColor: false,
        mostlyBlackLine: true,
        isTinyDrawing: false,
        isSparseDrawing: true,
        edgeComplexity: 0.1,
      },
    },
    expect: (final) => final >= 65,
    expectDescription: ">= 65 (casual stays forgiving)",
  },
  // --- New texture-focused cases (E/F/G/H) ---
  {
    label: "Case E: artist mid-low ratings + mostly black line should not land on bucket",
    input: {
      score: 90,
      recognition: 85,
      shape: 4,
      proportion: 3,
      details: 2,
      color: 1,
      composition: 2,
      creativity: 2,
      effort: 3,
      polish: 2,
      feedback: "Clean lines but needs more detail and color for Artist Mode.",
      targetMatch: true,
      detectedObject: "cup",
      targetMotif: "Cup",
      artistMode: true,
      judgeMode: "vision",
      drawingQuality: {
        inkCoverage: 0.03,
        boundingBoxCoverage: 0.18,
        colorCount: 0,
        usesColor: false,
        mostlyBlackLine: true,
        isTinyDrawing: false,
        isSparseDrawing: false,
        edgeComplexity: 0.1,
      },
    },
    expect: (final) =>
      final < 75 &&
      ![70, 72, 74, 78, 80, 84, 89, 90].includes(final),
    expectDescription: "< 75 and not a sticky bucket",
  },
  {
    label: "Case F: artist excellent ratings + good quality >= 92",
    input: {
      score: 100,
      recognition: 96,
      shape: 5,
      proportion: 5,
      details: 5,
      color: 4,
      composition: 5,
      creativity: 5,
      effort: 5,
      polish: 5,
      feedback: "Polished, detailed, recognizable, and expressive.",
      targetMatch: true,
      detectedObject: "cup",
      targetMotif: "Cup",
      artistMode: true,
      judgeMode: "vision",
      drawingQuality: {
        inkCoverage: 0.09,
        boundingBoxCoverage: 0.36,
        colorCount: 4,
        usesColor: true,
        mostlyBlackLine: false,
        isTinyDrawing: false,
        isSparseDrawing: false,
        edgeComplexity: 0.24,
      },
    },
    expect: (final) => final >= 92,
    expectDescription: ">= 92 (texture may bring near 100)",
  },
  {
    label: "Case G: artist wrong motif must cap <= 30 with variation",
    input: {
      score: 95,
      recognition: 50,
      shape: 3,
      proportion: 3,
      details: 3,
      color: 2,
      composition: 2,
      creativity: 3,
      effort: 3,
      polish: 3,
      feedback: "Looks like an apple but the target was a book.",
      targetMatch: false,
      detectedObject: "apple",
      targetMotif: "Book",
      artistMode: true,
      judgeMode: "vision",
    },
    expect: (final) => final <= 30,
    expectDescription: "<= 30",
  },
  {
    label: "Case I: artist open-book overpraise with weak proportion/creativity",
    input: {
      score: 92,
      recognition: 95,
      shape: 4,
      proportion: 2,
      details: 2,
      color: 1,
      composition: 2,
      creativity: 2,
      effort: 4,
      polish: 3,
      feedback:
        "Very clear and simple! You captured the open book shape perfectly. Great job!",
      targetMatch: true,
      detectedObject: "open book",
      targetMotif: "Book",
      artistMode: true,
      judgeMode: "vision",
      drawingQuality: {
        inkCoverage: 0.04,
        boundingBoxCoverage: 0.18,
        colorCount: 1,
        usesColor: false,
        mostlyBlackLine: true,
        isTinyDrawing: false,
        isSparseDrawing: false,
        edgeComplexity: 0.08,
      },
    },
    expect: (final) => final <= 76 && final >= 55,
    expectDescription: "55..76",
  },
  {
    label: "Case H: casual recognizable simple drawing 70-90 and not exactly bucketed",
    input: {
      score: 82,
      recognition: 88,
      shape: 4,
      proportion: 4,
      details: 3,
      color: 2,
      creativity: 3,
      effort: 3,
      polish: 3,
      feedback: "Clearly a cat, recognizable.",
      targetMatch: true,
      detectedObject: "cat",
      targetMotif: "Cat",
      artistMode: false,
      judgeMode: "vision",
      drawingQuality: {
        inkCoverage: 0.04,
        boundingBoxCoverage: 0.22,
        colorCount: 2,
        usesColor: true,
        mostlyBlackLine: false,
        isTinyDrawing: false,
        isSparseDrawing: false,
        edgeComplexity: 0.15,
      },
    },
    expect: (final) => final >= 70 && final <= 92,
    expectDescription: "70-92",
  },
];

export function runJudgeGuardSelfTest(): { pass: boolean; report: string } {
  const failures: string[] = [];
  for (const c of SELF_TEST_CASES) {
    const final = applyFinalScoreGuards(c.input);
    if (!c.expect(final)) {
      failures.push(`  - ${c.label}: got ${final}, expected ${c.expectDescription}`);
    }
  }
  if (failures.length === 0) {
    return {
      pass: true,
      report: `[judge-guard] self-test ok (${SELF_TEST_CASES.length} cases)`,
    };
  }
  return {
    pass: false,
    report: `[judge-guard] self-test FAILED:\n${failures.join("\n")}`,
  };
}
