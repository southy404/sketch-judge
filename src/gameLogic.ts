import type { Player } from "./types";

export function getWinners(players: Player[]): Player[] {
  if (players.length === 0) return [];
  const maxScore = Math.max(...players.map((player) => player.score));
  return players.filter((player) => player.score === maxScore);
}

export function getFinalTitle(players: Player[]): string {
  const winners = getWinners(players);
  if (winners.length === 0) return "Great game!";
  if (winners.length === 1) return `${winners[0].name} wins!`;
  return "It's a draw!";
}

export function rankPlayers(players: Player[]): Array<{ player: Player; rank: number }> {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  let lastScore: number | null = null;
  let lastRank = 0;

  return sorted.map((player, index) => {
    const rank = player.score === lastScore ? lastRank : index + 1;
    lastScore = player.score;
    lastRank = rank;
    return { player, rank };
  });
}

export function getNextActionLabel({
  turn,
  playerCount,
  round,
  rounds,
}: {
  turn: number;
  playerCount: number;
  round: number;
  rounds: number;
}): string {
  const lastPlayer = turn >= playerCount - 1;
  const lastRound = round >= rounds;

  if (!lastPlayer) return "next player";
  if (!lastRound) return "next round";
  return "show results";
}
