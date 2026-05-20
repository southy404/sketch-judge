import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function loadLocalEnv(): void {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return;

  for (const fileName of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), fileName);
    if (!existsSync(path)) continue;

    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) continue;

      process.env[key] = unquote(trimmed.slice(separatorIndex + 1));
    }
  }
}
