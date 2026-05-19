import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { clearHistory, loadHistory } from "../storage";
import type { GameHistoryEntry } from "../storage";
import { Crown } from "./Crown";

type SortOrder = "newest" | "oldest";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function searchableDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return [
    iso,
    d.toLocaleDateString(),
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  ].join(" ");
}

export function HistoryScreen() {
  const [history, setHistory] = useState<GameHistoryEntry[]>(() => loadHistory());
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [query, setQuery] = useState("");

  const visibleHistory = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? history.filter((game) => {
          const haystack = [
            game.winnerName,
            searchableDate(game.createdAt),
            ...game.players.map((player) => player.name),
          ].join(" ").toLowerCase();
          return haystack.includes(needle);
        })
      : history;

    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [history, query, sortOrder]);

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  return (
    <section className="screen tab-screen history">
      <div className="screen-top tab-top">
        <h1 className="tab-title">history</h1>
        {history.length > 0 && (
          <button type="button" className="ghost-back clear-history" onClick={handleClear} aria-label="clear history">
            <Trash2 size={16} /> clear
          </button>
        )}
      </div>

      <div className="history-controls">
        <input
          className="history-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="search name or date"
          aria-label="search history by name or date"
        />
        <div className="history-sort" role="group" aria-label="sort history">
          <button
            type="button"
            className={sortOrder === "newest" ? "active" : ""}
            onClick={() => setSortOrder("newest")}
          >
            new-old
          </button>
          <button
            type="button"
            className={sortOrder === "oldest" ? "active" : ""}
            onClick={() => setSortOrder("oldest")}
          >
            old-new
          </button>
        </div>
      </div>

      <div className="history-scroll-wrap">
        <div className="tab-scroll history-scroll">
          {history.length === 0 ? (
            <EmptyState />
          ) : visibleHistory.length === 0 ? (
            <div className="tab-empty">
              <p>nothing found.</p>
              <p>try another name or date.</p>
            </div>
          ) : (
            <ul className="history-list">
              {visibleHistory.map((g) => (
                <li key={g.id} className="history-card paper">
                  <header className="history-card-head">
                    <span className="history-date">{formatDate(g.createdAt)}</span>
                    <span className="history-rounds">{g.rounds} {g.rounds === 1 ? "round" : "rounds"}</span>
                  </header>
                  <p className="history-winner">
                    <Crown /> {g.winnerName} {g.winnerNames && g.winnerNames.length > 1 ? "draw" : "wins"}
                  </p>
                  <ul className="history-players">
                    {[...g.players]
                      .sort((a, b) => b.score - a.score)
                      .map((p, i) => (
                        <li key={`${g.id}-${p.name}-${i}`} className="history-player">
                          <span className="rank">{i + 1}</span>
                          <span className="name">{p.name}</span>
                          <span className="score">{p.score}</span>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="tab-empty">
      <p>no games yet.</p>
      <p>play a round and the result lands here.</p>
    </div>
  );
}
