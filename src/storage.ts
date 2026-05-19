export type Profile = {
  id: string;
  name: string;
  avatarColor: string;
};

export type PlayerStats = {
  name: string;
  totalScore: number;
  gamesPlayed: number;
  roundsPlayed: number;
  wins: number;
  bestScore: number;
  lastPlayedAt: string;
};

export type GameHistoryEntry = {
  id: string;
  createdAt: string;
  rounds: number;
  players: { name: string; score: number }[];
  winnerName: string;
  winnerNames?: string[];
};

const KEY_PROFILE = "sketch-judge:profile";
const KEY_STATS = "sketch-judge:stats";
const KEY_HISTORY = "sketch-judge:history";
const HISTORY_LIMIT = 30;

export const PLAYER_COLORS: readonly string[] = [
  "#69d7c9",
  "#ff7c78",
  "#70b7ff",
  "#ffd15c",
  "#ff9bc8",
  "#b99cff",
  "#b8794a",
  "#8fdb7a",
];

export const PROFILE_COLORS = PLAYER_COLORS;

export function normalizePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function safeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (quota etc.)
  }
}

// --- profile ---

export function loadProfile(): Profile | null {
  const value = readJson<Profile | null>(KEY_PROFILE, null);
  if (!value || typeof value.name !== "string") return null;
  return value;
}

export function saveProfile(profile: Profile): void {
  writeJson(KEY_PROFILE, profile);
}

export function createProfile(name: string, avatarColor: string): Profile {
  return {
    id: safeId(),
    name: name.trim() || "You",
    avatarColor,
  };
}

// --- stats ---

type StatsMap = Record<string, PlayerStats>;

export function loadStats(): StatsMap {
  return readJson<StatsMap>(KEY_STATS, {});
}

export function saveStats(stats: StatsMap): void {
  writeJson(KEY_STATS, stats);
}

export function listStats(): PlayerStats[] {
  const stats = loadStats();
  return Object.values(stats).sort((a, b) => b.totalScore - a.totalScore);
}

export function updateStatsFromGame(game: GameHistoryEntry): void {
  const stats = loadStats();
  const winnerKeys = new Set(
    (game.winnerNames?.length ? game.winnerNames : [game.winnerName]).map(normalizePlayerName)
  );

  for (const p of game.players) {
    const key = normalizePlayerName(p.name);
    const prev = stats[key] ?? {
      name: p.name,
      totalScore: 0,
      gamesPlayed: 0,
      roundsPlayed: 0,
      wins: 0,
      bestScore: 0,
      lastPlayedAt: "",
    };
    stats[key] = {
      name: p.name, // refresh display casing to most recent
      totalScore: prev.totalScore + p.score,
      gamesPlayed: prev.gamesPlayed + 1,
      roundsPlayed: prev.roundsPlayed + game.rounds,
      wins: prev.wins + (winnerKeys.has(key) ? 1 : 0),
      bestScore: Math.max(prev.bestScore, p.score),
      lastPlayedAt: game.createdAt,
    };
  }

  saveStats(stats);
}

// --- history ---

export function loadHistory(): GameHistoryEntry[] {
  const value = readJson<GameHistoryEntry[]>(KEY_HISTORY, []);
  if (!Array.isArray(value)) return [];
  return value;
}

export function saveHistory(history: GameHistoryEntry[]): void {
  writeJson(KEY_HISTORY, history);
}

export function saveGameHistoryEntry(game: GameHistoryEntry): void {
  const history = loadHistory();
  // de-dupe by id so re-renders / strict-mode-twice never doubles
  if (history.some((g) => g.id === game.id)) return;
  const next = [game, ...history].slice(0, HISTORY_LIMIT);
  saveHistory(next);
}

export function clearHistory(): void {
  saveHistory([]);
}

export function newGameId(): string {
  return safeId();
}
