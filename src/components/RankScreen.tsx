import { useState } from "react";
import { listStats } from "../storage";
import type { PlayerStats } from "../storage";
import { Crown } from "./Crown";

export function RankScreen() {
  const [stats] = useState<PlayerStats[]>(() => listStats());

  return (
    <section className="screen tab-screen rank">
      <div className="screen-top tab-top">
        <h1 className="tab-title">rank</h1>
        <small className="screen-eyebrow">all-time</small>
      </div>

      <div className="tab-scroll">
        {stats.length === 0 ? (
          <EmptyState />
        ) : (
          <ol className="rank-list">
            {stats.map((p, i) => (
              <li key={p.name} className={`rank-card paper${i === 0 ? " is-first" : ""}`}>
                <span className="rank-num">{i === 0 ? <Crown /> : i + 1}</span>
                <span className="rank-name">{p.name}</span>
                <div className="rank-stats">
                  <span>
                    <strong>{p.totalScore}</strong>
                    <em>total</em>
                  </span>
                  <span>
                    <strong>{p.wins}</strong>
                    <em>wins</em>
                  </span>
                  <span>
                    <strong>{p.gamesPlayed}</strong>
                    <em>games</em>
                  </span>
                  <span>
                    <strong>{p.bestScore}</strong>
                    <em>best</em>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="tab-empty">
      <p>no rankings yet.</p>
      <p>finish a game to see all-time scores here.</p>
    </div>
  );
}
