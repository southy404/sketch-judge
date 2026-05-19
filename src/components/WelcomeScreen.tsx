import { sketchJudgeAssets } from "./assets";
import { SvgUnderline } from "./SvgUnderline";

type Props = { onStart: () => void };

export function WelcomeScreen({ onStart }: Props) {
  return (
    <section className="screen welcome">
      <div className="welcome-stack">
        <div className="welcome-top">
          <h1 className="screen-title">welcome!</h1>
          <SvgUnderline className="word-underline title-underline" />
        </div>

        <div className="welcome-art">
          <img
            src={sketchJudgeAssets.sketchy}
            className="home-sketchy"
            alt="Sketch Judge character"
            draggable={false}
          />
        </div>

        <p className="welcome-text">
          AI picks a motif.<br />
          You draw it fast.<br />
          AI judges your art.<br />
          Everyone scores.<br />
          Let's sketch!
        </p>
      </div>

      <div className="screen-actions">
        <button className="primary" onClick={onStart}>start game</button>
      </div>
    </section>
  );
}
