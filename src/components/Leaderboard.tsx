import type { Player } from "../types";
import { rankPlayers } from "../gameLogic";
import { Crown } from "./Crown";

type Props = {
  players: Player[];
  highlightId?: string;
};

export function Leaderboard({ players, highlightId }: Props) {
  const ranked = rankPlayers(players);

  return (
    <ol className="leaderboard">
      {ranked.map(({ player, rank }) => (
        <li
          key={player.id}
          className={`leaderboard-row${player.id === highlightId ? " is-self" : ""}${rank === 1 ? " is-first" : ""}`}
        >
          <span className="rank">
            {rank === 1 ? <Crown /> : rank}
          </span>
          <span className="avatar" aria-hidden>
            <Avatar seed={player.id} color={player.avatarColor} />
          </span>
          <span className="player-name">{player.name}</span>
          <span className="player-score">{player.score}</span>
        </li>
      ))}
    </ol>
  );
}

function Avatar({ seed, color }: { seed: string; color: string }) {
  const code = seed.charCodeAt(0) + seed.charCodeAt(seed.length - 1);
  const variant = code % 4;

  return (
    <svg viewBox="0 0 36 36" className="avatar-svg">
      <circle cx="18" cy="18" r="16" fill={color} stroke="#111217" strokeWidth="1.5" />
      <circle cx="13" cy="17" r="1.4" fill="#111217" />
      <circle cx="23" cy="17" r="1.4" fill="#111217" />
      {variant === 0 && <path d="M12 22 Q18 26 24 22" stroke="#111217" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
      {variant === 1 && <path d="M13 23 L23 23" stroke="#111217" strokeWidth="1.6" strokeLinecap="round" />}
      {variant === 2 && <circle cx="18" cy="23" r="1.6" fill="none" stroke="#111217" strokeWidth="1.4" />}
      {variant === 3 && <path d="M12 22 Q18 20 24 22" stroke="#111217" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
    </svg>
  );
}
