import { useEffect, useState } from "react";
import type { JudgeResult } from "../types";
import { sketchJudgeAssets } from "./assets";
import { SvgUnderline } from "./SvgUnderline";
import { Sparkle } from "./Sparkle";
import { getScoreLabel } from "../scoring";

type Props = {
  judge: JudgeResult;
  nextLabel: string;
  artistMode?: boolean;
  onNext: () => void;
};

function dotsFromRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value > 5) return Math.max(0, Math.min(5, Math.round(value / 20)));
  return Math.max(0, Math.min(5, Math.round(value)));
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function dotsRow(value: number) {
  const filled = dotsFromRating(value);
  return (
    <span className="dots-row" aria-label={`${filled} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < filled ? "dot filled" : "dot"} />
      ))}
    </span>
  );
}

function TypingText({ text }: { text: string }) {
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    setVisibleLength(0);
    if (!text) return;

    const interval = window.setInterval(() => {
      setVisibleLength((current) => {
        if (current >= text.length) {
          window.clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 22);

    return () => window.clearInterval(interval);
  }, [text]);

  return (
    <p className="typing-text" aria-label={text}>
      <span aria-hidden="true">{text.slice(0, visibleLength)}</span>
      {visibleLength < text.length && <span className="typing-caret" aria-hidden />}
    </p>
  );
}

function kickerLabel(judge: JudgeResult): string {
  if (judge.judgeMode === "blank") return "no drawing";
  if (judge.judgeMode === "fallback") return "fallback score used";
  if (judge.judgeMode === "vision" || judge.source === "ollama") return "judged by AI";
  return "judged by AI";
}

export function ResultScreen({ judge, nextLabel, artistMode, onNext }: Props) {
  const score = clampScore(judge.score);
  const label = getScoreLabel({ ...judge, score, artistMode });

  return (
    <section className="screen result">
      <div className="result-scroll">
        <div className="result-kicker">
          <span className="kicker-spark" aria-hidden><Sparkle /></span>
          <strong>{kickerLabel(judge)}</strong>
          <span className="kicker-spark" aria-hidden><Sparkle /></span>
        </div>
        {artistMode && <span className="artist-pill artist-pill-result">artist mode</span>}

        <div className="score-banner">
          <img
            className="score-banner-bg"
            src={sketchJudgeAssets.score}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
          <div className="score-banner-content">
            <strong>{score}</strong>
            <span className="score-banner-caption">
              {label}
              <SvgUnderline className="small-underline" />
            </span>
          </div>
        </div>

        <div className="paper paper-ratings">
          <div className="rating-row rating-shape">
            <span className="rating-label">shape</span>
            {dotsRow(judge.shape)}
          </div>
          <div className="rating-row rating-proportion">
            <span className="rating-label">proportion</span>
            {dotsRow(judge.proportion ?? judge.details ?? 0)}
          </div>
          <div className="rating-row rating-creativity">
            <span className="rating-label">creativity</span>
            {dotsRow(judge.creativity)}
          </div>
          <div className="rating-row rating-effort">
            <span className="rating-label">effort</span>
            {dotsRow(judge.effort)}
          </div>
        </div>

        <div className="feedback-row">
          <span className="feedback-mascot" aria-hidden>
            <img src={sketchJudgeAssets.sketch} alt="" draggable={false} />
          </span>
          <div className="feedback-bubble">
            <TypingText text={judge.feedback} />
          </div>
        </div>
      </div>

      <div className="screen-actions">
        <button className="primary" onClick={onNext}>{nextLabel}</button>
      </div>
    </section>
  );
}
