import type { CSSProperties } from "react";
import type { Motif } from "../types";
import { sketchJudgeAssets } from "./assets";
import { RoundProgress } from "./RoundProgress";
import { SvgUnderline } from "./SvgUnderline";

type Props = {
  motif: Motif;
  seconds: number;
  round: number;
  totalRounds: number;
  playerName: string;
  playerColor: string;
  artistMode?: boolean;
  onExit: () => void;
};

export function RevealScreen({
  motif,
  seconds,
  round,
  totalRounds,
  playerName,
  playerColor,
  artistMode,
  onExit,
}: Props) {
  return (
    <section className="screen reveal" style={{ "--player-color": playerColor } as CSSProperties}>
      <div className="screen-top reveal-top">
        <RoundProgress round={round} totalRounds={totalRounds} />
        {artistMode && <span className="artist-pill">artist mode</span>}
        <button type="button" className="exit-btn" onClick={onExit} aria-label="exit">x</button>
      </div>

      <div className="reveal-stage">
        <div className="motif-note">
          <img
            className="motif-note-bg"
            src={sketchJudgeAssets.motif}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
          <div className="motif-note-content">
            <div className="motif-note-intro">
              <small className="motif-note-eyebrow">
                <span className="player-color-dot" aria-hidden />
                {playerName}
              </small>
              <p className="motif-note-lead">your motif is...</p>
            </div>
            <div className="motif-note-main">
              <h2 className="motif-note-word">
                {motif.name}
                <SvgUnderline className="word-underline motif-underline" />
              </h2>
              {motif.hint && <em className="motif-note-hint">{motif.hint}</em>}
            </div>
            <div className="motif-note-footer">
              <p className="motif-note-ready">get ready!</p>
              <div className="motif-note-countdown">
                00:{String(seconds).padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="screen-bottom" aria-hidden />
    </section>
  );
}
