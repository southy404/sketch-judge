import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import type { DrawingSummary, Player } from "../types";
import { getFinalTitle, getWinners } from "../gameLogic";
import { Leaderboard } from "./Leaderboard";
import { Sparkle } from "./Sparkle";

type FinishedTab = "leaderboard" | "summary";

type Props = {
  players: Player[];
  summaries: DrawingSummary[];
  artistMode?: boolean;
  onRestart: () => void;
};

export function FinishedScreen({ players, summaries, artistMode, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<FinishedTab>("leaderboard");
  const winners = getWinners(players);
  const title = getFinalTitle(players);
  const isDraw = winners.length > 1;

  return (
    <section className="screen finished">
      <div className="screen-top">
        <span className="title-music" aria-hidden><Sparkle /></span>
        <small className="screen-eyebrow">
          {artistMode ? "artist mode results" : "final results"}
        </small>
      </div>

      <div className="finished-stage">
        <h1 className="finished-title">{title}</h1>
        <p className="finished-sub">
          {isDraw
            ? winners.map((winner) => winner.name).join(" + ")
            : winners[0]
              ? `${winners[0].score} points`
              : "great game!"}
        </p>

        <div className="finished-tabs" role="tablist" aria-label="final results view">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "leaderboard"}
            className={activeTab === "leaderboard" ? "active" : ""}
            onClick={() => setActiveTab("leaderboard")}
          >
            leaderboard
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "summary"}
            className={activeTab === "summary" ? "active" : ""}
            onClick={() => setActiveTab("summary")}
          >
            summary
          </button>
        </div>

        <div className={`finished-panel${activeTab === "summary" ? " is-summary" : ""}`}>
          {activeTab === "leaderboard" ? (
            <div className="paper paper-lb">
              <Leaderboard players={players} highlightId={isDraw ? undefined : winners[0]?.id} />
            </div>
          ) : (
            <SummaryList summaries={summaries} />
          )}
        </div>
      </div>

      <div className="screen-actions">
        <button className="primary" onClick={onRestart}>play again</button>
      </div>
    </section>
  );
}

type FileShareData = ShareData & { files?: File[] };
type FileShareNavigator = Navigator & {
  canShare?: (data: FileShareData) => boolean;
  share?: (data: FileShareData) => Promise<void>;
};

function safeFilePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34) || "drawing";
}

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/png" });
}

async function shareSummaryImage(item: DrawingSummary) {
  if (!item.imageBase64) return;

  const fileName = `sketch-judge-${safeFilePart(item.playerName)}-${safeFilePart(item.motif)}.png`;
  const file = await dataUrlToFile(item.imageBase64, fileName);
  const sharePayload: FileShareData = {
    files: [file],
    title: `Sketch Judge: ${item.motif}`,
    text: `${item.playerName} scored ${item.score} on ${item.motif}.`,
  };
  const nav = navigator as FileShareNavigator;

  if (nav.share && (!nav.canShare || nav.canShare(sharePayload))) {
    await nav.share(sharePayload);
    return;
  }

  const link = document.createElement("a");
  link.href = item.imageBase64;
  link.download = fileName;
  link.click();
}

function SummaryList({ summaries }: { summaries: DrawingSummary[] }) {
  const [previewItem, setPreviewItem] = useState<DrawingSummary | null>(null);

  useEffect(() => {
    if (!previewItem) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewItem(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem]);

  if (summaries.length === 0) {
    return (
      <div className="summary-empty paper">
        <p>no drawings saved.</p>
      </div>
    );
  }

  return (
    <>
      <div className="summary-scroll">
        <ul className="summary-list">
          {summaries.map((item) => (
            <li key={item.id} className="summary-card paper">
              <button
                type="button"
                className="summary-thumb"
                onClick={() => setPreviewItem(item)}
                disabled={!item.imageBase64}
                aria-label={`open ${item.playerName}'s ${item.motif} drawing`}
              >
                {item.imageBase64 ? (
                  <img src={item.imageBase64} alt={`${item.playerName} drawing of ${item.motif}`} />
                ) : (
                  <span>no drawing</span>
                )}
              </button>
              <div className="summary-meta">
                <span className="summary-player">
                  <span className="summary-dot" style={{ background: item.avatarColor }} aria-hidden />
                  {item.playerName}
                </span>
                <span className="summary-motif">round {item.round} - {item.motif}</span>
              </div>
              <div className="summary-actions">
                <span className="summary-score">{item.score}</span>
                <button
                  type="button"
                  className="summary-share"
                  onClick={() => void shareSummaryImage(item)}
                  disabled={!item.imageBase64}
                  aria-label={`share ${item.playerName}'s ${item.motif} drawing`}
                >
                  <Share2 size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {previewItem?.imageBase64 && (
        <div className="summary-lightbox" role="dialog" aria-modal="true" onClick={() => setPreviewItem(null)}>
          <div className="summary-lightbox-card" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="summary-lightbox-close"
              onClick={() => setPreviewItem(null)}
              aria-label="close drawing preview"
            >
              <X size={22} />
            </button>
            <img
              src={previewItem.imageBase64}
              alt={`${previewItem.playerName} drawing of ${previewItem.motif}`}
            />
          </div>
        </div>
      )}
    </>
  );
}
