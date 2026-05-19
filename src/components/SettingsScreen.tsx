import { useState } from "react";
import type { Player } from "../types";
import { PLAYER_COLORS } from "../storage";
import { sketchJudgeAssets } from "./assets";

const MAX_PLAYERS = 4;

type Props = {
  players: Player[];
  rounds: number;
  drawLength: number;
  artistMode: boolean;
  addPlayer: () => void;
  removePlayer: (id: string) => void;
  renamePlayer: (id: string, name: string) => void;
  changePlayerColor: (id: string, color: string) => void;
  setRounds: (n: number) => void;
  setDrawLength: (n: number) => void;
  setArtistMode: (v: boolean) => void;
  onStart: () => void;
  onBack: () => void;
};

type PickerProps<T extends number> = {
  label: string;
  value: T;
  options: readonly T[];
  suffix?: string;
  onChange: (v: T) => void;
};

function Picker<T extends number>({ label, value, options, suffix = "", onChange }: PickerProps<T>) {
  return (
    <div className="picker">
      <span className="picker-label">{label}</span>
      <div className="picker-row">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={opt === value ? "chip active" : "chip"}
            onClick={() => onChange(opt)}
          >
            {opt}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsScreen(props: Props) {
  const [colorPlayerId, setColorPlayerId] = useState<string | null>(null);
  const colorPlayer = props.players.find((player) => player.id === colorPlayerId);

  function chooseColor(color: string) {
    if (!colorPlayer) return;
    props.changePlayerColor(colorPlayer.id, color);
    setColorPlayerId(null);
  }

  return (
    <section className="screen settings">
      <div className="screen-top">
        <button type="button" className="ghost-back" onClick={props.onBack}>back</button>
        <small className="screen-eyebrow">game setup</small>
      </div>

      <div className="setup-note">
        <img
          className="setup-note-bg"
          src={sketchJudgeAssets.motif}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
        <div className="setup-note-content">
          <div className="settings-block">
            <span className="block-label">players</span>
            <ul className="player-list">
              {props.players.map((player) => {
                const initial = (player.name.trim()[0] ?? "?").toUpperCase();

                return (
                  <li key={player.id} className="player-item">
                    <div className="player-row">
                      <button
                        type="button"
                        className="player-avatar-preview"
                        style={{ background: player.avatarColor }}
                        onClick={() => setColorPlayerId(player.id)}
                        aria-label={`choose avatar color for ${player.name || "player"}`}
                      >
                        {initial}
                      </button>
                      <input
                        className="player-input"
                        value={player.name}
                        maxLength={18}
                        onChange={(e) => props.renamePlayer(player.id, e.target.value)}
                        aria-label="player name"
                      />
                      <button
                        type="button"
                        className="player-remove"
                        onClick={() => props.removePlayer(player.id)}
                        disabled={props.players.length <= 1}
                        aria-label="remove player"
                      >
                        x
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {props.players.length < MAX_PLAYERS && (
              <button type="button" className="ghost-add" onClick={props.addPlayer}>+ add player</button>
            )}
          </div>

          <div className="settings-block">
            <Picker
              label="rounds"
              value={props.rounds}
              options={[1, 3, 5] as const}
              onChange={props.setRounds}
            />
          </div>

          <div className="settings-block">
            <Picker
              label="draw time"
              value={props.drawLength}
              options={[30, 45, 60] as const}
              suffix="s"
              onChange={props.setDrawLength}
            />
          </div>

          <div className="settings-block">
            <label className="artist-toggle">
              <div className="artist-toggle-text">
                <span className="artist-toggle-label">Artist Mode</span>
                <span className="artist-toggle-sub">Harder prompts. Stricter judging.</span>
              </div>
              <input
                type="checkbox"
                className="artist-toggle-input"
                checked={props.artistMode}
                onChange={(e) => props.setArtistMode(e.target.checked)}
                aria-label="toggle artist mode"
              />
              <span className={`artist-toggle-switch${props.artistMode ? " is-on" : ""}`} aria-hidden>
                <span className="artist-toggle-knob" />
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="screen-actions">
        <button className="primary" onClick={props.onStart}>let Gemma choose</button>
      </div>

      {colorPlayer && (
        <div className="color-modal-backdrop" role="presentation" onClick={() => setColorPlayerId(null)}>
          <div
            className="color-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`avatar color for ${colorPlayer.name || "player"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="color-modal-title">avatar color</span>
            <div className="color-modal-swatches">
              {PLAYER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={color === colorPlayer.avatarColor ? "swatch active" : "swatch"}
                  style={{ background: color }}
                  onClick={() => chooseColor(color)}
                  aria-label={`avatar color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
