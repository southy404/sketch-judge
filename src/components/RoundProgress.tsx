type RoundProgressProps = {
  round: number;
  totalRounds: number;
};

export function RoundProgress({ round, totalRounds }: RoundProgressProps) {
  const safeTotal = Math.max(1, totalRounds);
  const safeRound = Math.max(1, Math.min(round, safeTotal));
  const progress = (safeRound / safeTotal) * 100;

  return (
    <div className="round-progress">
      <div className="round-progress__text">round {safeRound}/{safeTotal}</div>
      <div className="round-progress__line" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
