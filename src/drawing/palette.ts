export type PaletteGroup = {
  readonly name: string;
  readonly colors: readonly string[];
};

export const paletteGroups: readonly PaletteGroup[] = [
  {
    name: "ink",
    colors: ["#111217", "#3a3d45", "#6b7280", "#9ca3af"],
  },
  {
    name: "red",
    colors: ["#ff7c78", "#ff9a96", "#d94b4b", "#ffb3b0", "#b91c1c"],
  },
  {
    name: "blue",
    colors: ["#70b7ff", "#4f8fe8", "#a8d8ff", "#1f5fbf", "#0f3f91"],
  },
  {
    name: "green",
    colors: ["#69d7c9", "#36b8a8", "#a4efe4", "#2f7d72", "#16635b"],
  },
  {
    name: "yellow",
    colors: ["#ffd15c", "#ffb84d", "#ffe8a3", "#c98919", "#8a5a00"],
  },
  {
    name: "pink",
    colors: ["#ff9bc8", "#ff6da8", "#ffd1e6", "#c94d83", "#9d174d"],
  },
  {
    name: "purple",
    colors: ["#b99cff", "#8f6ce8", "#ded0ff", "#5f42b5", "#3b238a"],
  },
  {
    name: "brown",
    colors: ["#b8794a", "#8a5632", "#d9a066", "#5a3822", "#3b2415"],
  },
  {
    name: "white",
    colors: ["#ffffff", "#fffef9", "#f2f2f2", "#e5e7eb"],
  },
] as const;

export const DEFAULT_COLOR = paletteGroups[0].colors[0];
