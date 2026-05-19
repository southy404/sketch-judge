import { useCallback, useEffect, useRef, useState } from "react";
import type { AppTab, DrawingSummary, JudgeResult, Motif, Phase, Player } from "./types";
import type { CanvasAnalysis } from "./drawing/imageStats";
import { requestJudge, requestMotif } from "./api";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { RevealScreen } from "./components/RevealScreen";
import { DrawingScreen } from "./components/DrawingScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { ResultScreen } from "./components/ResultScreen";
import { FinishedScreen } from "./components/FinishedScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { RankScreen } from "./components/RankScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { BottomNav } from "./components/BottomNav";
import {
  PLAYER_COLORS,
  loadProfile,
  newGameId,
  saveGameHistoryEntry,
  updateStatsFromGame,
} from "./storage";
import type { GameHistoryEntry, Profile } from "./storage";
import { getNextActionLabel, getWinners } from "./gameLogic";

const REVEAL_SECONDS = 5;
const MAX_PLAYERS = 4;
const RECENT_MOTIFS_KEY = "sketchJudge.recentMotifs";
const RECENT_MOTIFS_LIMIT = 24;
const RECENT_CATEGORIES_KEY = "sketchJudge.recentCategories";
const RECENT_CATEGORIES_LIMIT = 8;

function loadStringList(key: string, limit: number): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").slice(0, limit);
  } catch {
    return [];
  }
}

function saveStringList(key: string, list: string[], limit: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list.slice(0, limit)));
  } catch {
    // ignore quota errors
  }
}

function safeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

function colorAt(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

function makePlayer(name: string, color: string): Player {
  return { id: safeId(), name, score: 0, avatarColor: color };
}

function bgClassFor(tab: AppTab, phase: Phase): string {
  if (tab === "home") return "bg-mint";
  if (tab === "history") return "bg-cream";
  if (tab === "rank") return "bg-sky";
  if (tab === "profile") return "bg-pink";
  switch (phase) {
    case "settings":
    case "generating":
    case "reveal":
      return "bg-sky";
    case "drawing":
      return "bg-cream";
    case "judging":
    case "leaderboard":
      return "bg-yellow";
    case "finished":
      return "bg-pink";
  }
}

function isNavVisible(tab: AppTab): boolean {
  return tab !== "game";
}

export function App() {
  const initialProfile = loadProfile();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [tab, setTab] = useState<AppTab>("home");
  const [phase, setPhase] = useState<Phase>("settings");
  const [players, setPlayers] = useState<Player[]>([
    makePlayer(initialProfile?.name ?? "You", initialProfile?.avatarColor ?? colorAt(0)),
    makePlayer("Mia", colorAt(1)),
  ]);
  const [rounds, setRounds] = useState(3);
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState(0);
  const [motif, setMotif] = useState<Motif | null>(null);
  const [revealSeconds, setRevealSeconds] = useState(REVEAL_SECONDS);
  const [drawLength, setDrawLength] = useState(45);
  const [drawSeconds, setDrawSeconds] = useState(45);
  const [judge, setJudge] = useState<JudgeResult | null>(null);
  const [drawingSummaries, setDrawingSummaries] = useState<DrawingSummary[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [artistMode, setArtistMode] = useState(false);
  const [recentMotifs, setRecentMotifs] = useState<string[]>(() =>
    loadStringList(RECENT_MOTIFS_KEY, RECENT_MOTIFS_LIMIT)
  );
  const [recentCategories, setRecentCategories] = useState<string[]>(() =>
    loadStringList(RECENT_CATEGORIES_KEY, RECENT_CATEGORIES_LIMIT)
  );

  const submittingRef = useRef(false);
  const savedGameIdRef = useRef<string | null>(null);
  const gameIdRef = useRef<string | null>(null);

  useEffect(() => {
    setPlayers((prev) => (prev.length > MAX_PLAYERS ? prev.slice(0, MAX_PLAYERS) : prev));
  }, [players.length]);

  const currentPlayer = players[turn] ?? players[0];
  const isLastPlayer = turn >= players.length - 1;
  const isLastRound = round >= rounds;

  const nextActionLabel = getNextActionLabel({
    turn,
    playerCount: players.length,
    round,
    rounds,
  });

  const startNewRound = useCallback(
    async (nextTurn = 0) => {
      setTurn(nextTurn);
      setPhase("generating");
      setJudge(null);
      const m = await requestMotif({
        round,
        totalRounds: rounds,
        players: players.map((p) => p.name),
        recentMotifs,
        recentCategories,
        artistMode,
      });
      setMotif(m);
      setRecentMotifs((prev) => {
        const next = [m.name, ...prev.filter((n) => n.toLowerCase() !== m.name.toLowerCase())].slice(
          0,
          RECENT_MOTIFS_LIMIT
        );
        saveStringList(RECENT_MOTIFS_KEY, next, RECENT_MOTIFS_LIMIT);
        return next;
      });
      setRecentCategories((prev) => {
        const next = [m.category, ...prev].slice(0, RECENT_CATEGORIES_LIMIT);
        saveStringList(RECENT_CATEGORIES_KEY, next, RECENT_CATEGORIES_LIMIT);
        return next;
      });
      setRevealSeconds(REVEAL_SECONDS);
      setPhase("reveal");
    },
    [artistMode, players, recentCategories, recentMotifs, round, rounds]
  );

  function refreshPlayerOneFromProfile() {
    setPlayers((prev) => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      const next = [...prev];
      next[0] = {
        ...first,
        name: profile?.name ?? first.name ?? "You",
        avatarColor: profile?.avatarColor ?? first.avatarColor ?? colorAt(0),
      };
      return next;
    });
  }

  async function handleStartGame() {
    savedGameIdRef.current = null;
    gameIdRef.current = newGameId();
    setRound(1);
    setDrawingSummaries([]);
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, lastScore: undefined })));
    setTab("game");
    await startNewRound(0);
  }

  function handleStartFromHome() {
    refreshPlayerOneFromProfile();
    setTab("game");
    setPhase("settings");
  }

  function startTurnForNextPlayer() {
    setJudge(null);
    setRevealSeconds(REVEAL_SECONDS);
    setPhase("reveal");
  }

  useEffect(() => {
    if (tab !== "game") return;
    if (phase !== "reveal") return;
    const id = window.setInterval(() => {
      setRevealSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          setDrawSeconds(drawLength);
          setPhase("drawing");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [tab, phase, drawLength]);

  useEffect(() => {
    if (tab !== "game") return;
    if (phase !== "drawing") return;
    const id = window.setInterval(() => {
      setDrawSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [tab, phase]);

  const submitDrawing = useCallback(
    async (
      imageBase64: string,
      actionCount: number,
      analysis: CanvasAnalysis | undefined
    ) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setPhase("judging");

      try {
        let result: JudgeResult;
        if (analysis?.isBlank) {
          // Skip the network entirely — honest zero for empty canvas.
          result = {
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
          };
          setToast("");
        } else {
          result = await requestJudge({
            motif: motif?.name ?? "Object",
            imageBase64,
            actionCount,
            artistMode,
            canvasAnalysis: analysis,
          });
          if (result.judgeMode === "fallback") {
            setToast("Fallback score used. Motif match could not be fully verified.");
          } else {
            setToast("");
          }
        }

        setJudge(result);
        const player = players[turn];
        if (player) {
          setDrawingSummaries((prev) => [
            ...prev,
            {
              id: `${gameIdRef.current ?? "game"}-${round}-${turn}-${player.id}`,
              round,
              motif: motif?.name ?? "Object",
              playerId: player.id,
              playerName: player.name,
              avatarColor: player.avatarColor,
              score: result.score,
              imageBase64,
            },
          ]);
        }
        setPlayers((prev) =>
          prev.map((p, index) =>
            index === turn ? { ...p, score: p.score + result.score, lastScore: result.score } : p
          )
        );
        setPhase("leaderboard");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [motif, players, round, turn, artistMode]
  );

  // Persist game once when we reach the finished phase.
  useEffect(() => {
    if (tab !== "game") return;
    if (phase !== "finished") return;
    const gameId = gameIdRef.current ?? newGameId();
    if (savedGameIdRef.current === gameId) return;
    savedGameIdRef.current = gameId;

    const winners = getWinners(players);
    const entry: GameHistoryEntry = {
      id: gameId,
      createdAt: new Date().toISOString(),
      rounds,
      players: players.map((p) => ({ name: p.name, score: p.score })),
      winnerName: winners.map((winner) => winner.name).join(" + ") || "?",
      winnerNames: winners.map((winner) => winner.name),
    };
    saveGameHistoryEntry(entry);
    updateStatsFromGame(entry);
  }, [tab, phase, players, rounds]);

  async function handleNext() {
    if (!isLastPlayer) {
      setTurn((v) => v + 1);
      startTurnForNextPlayer();
      return;
    }
    if (isLastRound) {
      setPhase("finished");
      return;
    }
    setRound((v) => v + 1);
    await startNewRound(0);
  }

  function handleRestart() {
    setRound(1);
    setTurn(0);
    setMotif(null);
    setJudge(null);
    setDrawingSummaries([]);
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, lastScore: undefined })));
    savedGameIdRef.current = null;
    gameIdRef.current = null;
    setTab("home");
    setPhase("settings");
  }

  function exitToHome() {
    setTab("home");
  }

  function addPlayer() {
    setPlayers((prev) =>
      prev.length >= MAX_PLAYERS ? prev : [...prev, makePlayer(`Player ${prev.length + 1}`, colorAt(prev.length))]
    );
  }
  function removePlayer(id: string) {
    setPlayers((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)));
  }
  function renamePlayer(id: string, name: string) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }
  function changePlayerColor(id: string, avatarColor: string) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, avatarColor } : p)));
  }

  function handleProfileSaved(next: Profile) {
    setProfile(next);
    setPlayers((prev) => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      const out = [...prev];
      out[0] = { ...first, name: next.name, avatarColor: next.avatarColor };
      return out;
    });
  }

  function handleNavChange(nextTab: AppTab) {
    if (nextTab === tab) return;
    if (tab === "game" && phase !== "settings") {
      // user aborted mid-game
      savedGameIdRef.current = null;
      gameIdRef.current = null;
      setPhase("settings");
    }
    setTab(nextTab);
  }

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const bgClass = bgClassFor(tab, phase);
  const navVisible = isNavVisible(tab);

  return (
    <main className={`app ${bgClass}${navVisible ? " has-nav" : ""}`}>
      {tab === "home" && <WelcomeScreen onStart={handleStartFromHome} />}
      {tab === "history" && <HistoryScreen />}
      {tab === "rank" && <RankScreen />}
      {tab === "profile" && <ProfileScreen onSaved={handleProfileSaved} />}

      {tab === "game" && phase === "settings" && (
        <SettingsScreen
          players={players}
          rounds={rounds}
          drawLength={drawLength}
          artistMode={artistMode}
          addPlayer={addPlayer}
          removePlayer={removePlayer}
          renamePlayer={renamePlayer}
          changePlayerColor={changePlayerColor}
          setRounds={setRounds}
          setDrawLength={setDrawLength}
          setArtistMode={setArtistMode}
          onStart={handleStartGame}
          onBack={exitToHome}
        />
      )}
      {tab === "game" && phase === "generating" && (
        <LoadingScreen
          title="Gemma is choosing..."
          subtitle={currentPlayer ? `for ${currentPlayer.name}` : "picking the next motif"}
          accentColor={currentPlayer?.avatarColor}
        />
      )}
      {tab === "game" && phase === "reveal" && motif && currentPlayer && (
        <RevealScreen
          motif={motif}
          seconds={revealSeconds}
          round={round}
          totalRounds={rounds}
          playerName={currentPlayer.name}
          playerColor={currentPlayer.avatarColor}
          artistMode={artistMode}
          onExit={exitToHome}
        />
      )}
      {tab === "game" && phase === "drawing" && motif && currentPlayer && (
        <DrawingScreen
          motif={motif.name}
          seconds={drawSeconds}
          round={round}
          totalRounds={rounds}
          playerName={currentPlayer.name}
          artistMode={artistMode}
          submit={submitDrawing}
          submitting={submitting}
        />
      )}
      {tab === "game" && phase === "judging" && (
        <LoadingScreen
          title="AI is judging..."
          subtitle="checking your drawing"
          accentColor={currentPlayer?.avatarColor}
        />
      )}
      {tab === "game" && phase === "leaderboard" && judge && currentPlayer && (
        <ResultScreen
          judge={judge}
          nextLabel={nextActionLabel}
          artistMode={artistMode}
          onNext={handleNext}
        />
      )}
      {tab === "game" && phase === "finished" && (
        <FinishedScreen
          players={players}
          summaries={drawingSummaries}
          artistMode={artistMode}
          onRestart={handleRestart}
        />
      )}

      {navVisible && <BottomNav active={tab} onChange={handleNavChange} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
