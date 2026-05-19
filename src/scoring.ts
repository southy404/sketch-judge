type ScoreLike =
  | number
  | {
      score: number;
      targetMatch?: boolean;
      artistMode?: boolean;
      shape?: number;
      proportion?: number;
      details?: number;
      creativity?: number;
      effort?: number;
    };

const ARTIST_LABELS = [
  "Try again!",
  "Keep refining!",
  "Nice try!",
  "Good work!",
  "Strong work!",
  "Excellent!",
] as const;

type ArtistLabel = typeof ARTIST_LABELS[number];

function artistLabelRank(label: ArtistLabel): number {
  return ARTIST_LABELS.indexOf(label);
}

export function getScoreLabel(result: ScoreLike): string {
  const score = typeof result === "number" ? result : result.score;
  const targetMatch = typeof result === "number" ? undefined : result.targetMatch;
  const artistMode = typeof result === "number" ? false : Boolean(result.artistMode);

  if (targetMatch === false || score <= 30) return "Wrong motif";

  if (artistMode) {
    let label: ArtistLabel;
    if (score >= 95) label = "Excellent!";
    else if (score >= 88) label = "Strong work!";
    else if (score >= 75) label = "Good work!";
    else if (score >= 60) label = "Nice try!";
    else if (score >= 35) label = "Keep refining!";
    else label = "Try again!";

    if (typeof result !== "number") {
      const visibleProportion = result.proportion ?? result.details;
      const visibleRatings: number[] = [
        result.shape,
        visibleProportion,
        result.creativity,
        result.effort,
      ].filter((v): v is number => typeof v === "number");

      if (visibleRatings.length === 4) {
        const lowCount = visibleRatings.filter((v) => v <= 2).length;
        if (lowCount >= 2 && artistLabelRank(label) > artistLabelRank("Nice try!")) {
          label = "Nice try!";
        } else if (lowCount >= 1 && artistLabelRank(label) > artistLabelRank("Good work!")) {
          label = "Good work!";
        }
      }
    }

    return label;
  }

  if (score >= 90) return "Amazing!";
  if (score >= 75) return "Great work!";
  if (score >= 50) return "Nice try!";
  return "Keep sketching!";
}

export function feedbackForScore(score: number): string {
  if (score === 0) return "No drawing submitted.";
  if (score >= 90) return "Amazing! The motif is easy to recognize.";
  if (score >= 80) return "Great work! The drawing is clear and recognizable.";
  if (score >= 65) return "Nice job! The main shape comes through.";
  if (score >= 45) return "Good start! A few more details would help.";
  if (score >= 20) return "Keep trying! Make the shape bigger and clearer.";
  return "Almost! Try drawing a clearer outline next time.";
}
