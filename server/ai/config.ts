import type { AiProviderName } from "./types.js";

export type AiConfig = {
  primaryProvider: AiProviderName;
  fallbackProvider: AiProviderName;
  ollama: {
    baseUrl: string;
    model: string;
  };
  openRouter: {
    apiKey: string;
    configured: boolean;
    model: string;
    baseUrl: string;
    siteUrl: string;
    appName: string;
  };
};

function readEnv(name: string): string {
  return (process.env[name] || "").trim();
}

function normalizeProviderName(
  value: string | undefined,
  fallback: AiProviderName
): AiProviderName {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "openrouter") return "openrouter";
  if (normalized === "ollama") return "ollama";
  return fallback;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function defaultProvider(): AiProviderName {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return "openrouter";
  return "ollama";
}

export function getAiConfig(): AiConfig {
  const openRouterApiKey = readEnv("OPENROUTER_API_KEY");
  const ollamaBaseUrl =
    readEnv("OLLAMA_BASE_URL") ||
    readEnv("OLLAMA_URL") ||
    "http://127.0.0.1:11434";

  return {
    primaryProvider: normalizeProviderName(
      process.env.AI_PROVIDER,
      defaultProvider()
    ),
    fallbackProvider: normalizeProviderName(
      process.env.AI_FALLBACK_PROVIDER,
      "ollama"
    ),
    ollama: {
      baseUrl: stripTrailingSlash(ollamaBaseUrl),
      model: readEnv("OLLAMA_MODEL") || "gemma4:e4b",
    },
    openRouter: {
      apiKey: openRouterApiKey,
      configured: openRouterApiKey.length > 0,
      model: readEnv("OPENROUTER_MODEL") || "google/gemma-4-26b-a4b-it",
      baseUrl: stripTrailingSlash(
        readEnv("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1"
      ),
      siteUrl:
        readEnv("OPENROUTER_SITE_URL") || "https://sketch-judge.vercel.app",
      appName: readEnv("OPENROUTER_APP_NAME") || "Sketch Judge",
    },
  };
}
