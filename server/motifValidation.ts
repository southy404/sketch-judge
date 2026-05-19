import {
  BORING_MOTIFS,
  UNSAFE_KEYWORDS,
  type MotifCategory,
  type MotifDifficulty,
  type MotifSeed,
} from "./motifs";

const ALLOWED_DIFFICULTIES: MotifDifficulty[] = ["easy", "medium", "hard", "artist"];
const ALLOWED_CATEGORIES: MotifCategory[] = [
  "object", "animal", "food", "nature", "vehicle", "place",
  "fantasy", "action", "scene", "emotion", "composition", "funny",
];

export type CandidateMotif = {
  name: unknown;
  hint: unknown;
  difficulty: unknown;
  category: unknown;
};

export function normalizeMotifName(name: string): string {
  return name
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isRecentlyUsed(name: string, recentMotifs: string[]): boolean {
  const norm = normalizeMotifName(name);
  return recentMotifs.some((r) => normalizeMotifName(r) === norm);
}

export function isBoringMotif(name: string): boolean {
  const norm = normalizeMotifName(name);
  if (BORING_MOTIFS.includes(norm)) return true;
  for (const boring of BORING_MOTIFS) {
    if (norm === boring) return true;
  }
  return false;
}

export function isUnsafeMotif(name: string): boolean {
  const norm = normalizeMotifName(name);
  return UNSAFE_KEYWORDS.some((k) => norm.includes(k));
}

function isAllowedDifficulty(value: string): value is MotifDifficulty {
  return (ALLOWED_DIFFICULTIES as string[]).includes(value);
}

function isAllowedCategory(value: string): value is MotifCategory {
  return (ALLOWED_CATEGORIES as string[]).includes(value);
}

export function isValidMotif(
  motif: CandidateMotif,
  opts: { recentMotifs: string[]; artistMode: boolean }
): motif is MotifSeed {
  if (typeof motif.name !== "string") return false;
  if (typeof motif.hint !== "string") return false;
  if (typeof motif.difficulty !== "string") return false;
  if (typeof motif.category !== "string") return false;

  const name = motif.name.trim();
  const hint = motif.hint.trim();
  if (name.length < 2 || name.length > 40) return false;
  if (hint.length < 4 || hint.length > 100) return false;
  if (!isAllowedDifficulty(motif.difficulty)) return false;
  if (!isAllowedCategory(motif.category)) return false;

  if (isUnsafeMotif(name)) return false;
  if (isRecentlyUsed(name, opts.recentMotifs)) return false;

  const tokens = normalizeMotifName(name).split(" ");
  if (opts.artistMode) {
    if (isBoringMotif(name)) return false;
    if (tokens.length === 1 && BORING_MOTIFS.includes(tokens[0])) return false;
    if (tokens.length > 5) return false;
  } else {
    if (isBoringMotif(name)) return false;
  }

  return true;
}
