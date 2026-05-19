import type { CSSProperties } from "react";
import { Sparkle } from "./Sparkle";

type LoadingScreenProps = {
  title: string;
  subtitle?: string;
  accentColor?: string;
};

export function LoadingScreen({ title, subtitle, accentColor }: LoadingScreenProps) {
  const style: CSSProperties = accentColor ? { backgroundColor: accentColor } : {};

  return (
    <section className="screen loading" style={style}>
      <div className="loading-stage">
        <div className="loading-card">
          <div className="loading-sparkles" aria-hidden>
            <span className="spark sparkle s1"><Sparkle /></span>
            <span className="spark sparkle s2"><Sparkle /></span>
            <span className="spark sparkle s3"><Sparkle /></span>
          </div>
          <h2 className="loading-title">{title}</h2>
          {subtitle && <p className="loading-sub">{subtitle}</p>}
          <div className="loading-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
