import { useState } from "react";
import { Check } from "lucide-react";
import {
  PROFILE_COLORS,
  createProfile,
  loadProfile,
  saveProfile,
} from "../storage";
import type { Profile } from "../storage";

type Props = {
  onSaved: (profile: Profile) => void;
};

export function ProfileScreen({ onSaved }: Props) {
  const existing = loadProfile();
  const [name, setName] = useState<string>(existing?.name ?? "");
  const [color, setColor] = useState<string>(existing?.avatarColor ?? PROFILE_COLORS[0]);
  const [savedFlash, setSavedFlash] = useState(false);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0;
  const displayInitial = (trimmed[0] ?? "?").toUpperCase();

  function handleSave() {
    if (!canSave) return;
    const next: Profile = existing
      ? { ...existing, name: trimmed, avatarColor: color }
      : createProfile(trimmed, color);
    saveProfile(next);
    onSaved(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <section className="screen tab-screen profile">
      <div className="screen-top tab-top">
        <h1 className="tab-title">profile</h1>
        <small className="screen-eyebrow">your main player</small>
      </div>

      <div className="tab-scroll">
        <div className="profile-card paper">
          <div className="profile-preview">
            <span className="profile-avatar" style={{ background: color }}>
              {displayInitial}
            </span>
            <div className="profile-preview-text">
              <strong>{trimmed || "your name"}</strong>
              <small>used as default first player</small>
            </div>
          </div>

          <label className="profile-field">
            <span>name</span>
            <input
              className="player-input"
              value={name}
              maxLength={18}
              onChange={(e) => setName(e.target.value)}
              placeholder="enter your name"
              aria-label="profile name"
            />
          </label>

          <div className="profile-field">
            <span>avatar color</span>
            <div className="color-choice">
              {PROFILE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={c === color ? "swatch active" : "swatch"}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`avatar color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="screen-actions">
        <button className="primary" onClick={handleSave} disabled={!canSave}>
          {savedFlash ? (
            <>
              <Check size={18} /> saved
            </>
          ) : (
            "save profile"
          )}
        </button>
      </div>
    </section>
  );
}
