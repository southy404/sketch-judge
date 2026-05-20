import { getAiConfig, type AiConfig } from "./config";
import { createOllamaProvider } from "./ollamaProvider";
import { createOpenRouterProvider } from "./openRouterProvider";
import type { AiProvider, AiProviderName } from "./types";

export class AiConfigurationError extends Error {
  provider: AiProviderName;

  constructor(provider: AiProviderName, message: string) {
    super(message);
    this.name = "AiConfigurationError";
    this.provider = provider;
  }
}

export function createAiProvider(name: AiProviderName, config: AiConfig): AiProvider | null {
  if (name === "ollama") return createOllamaProvider(config.ollama);
  if (!config.openRouter.configured) return null;
  return createOpenRouterProvider(config.openRouter);
}

export function getAiProviderModel(name: AiProviderName, config: AiConfig = getAiConfig()): string {
  return name === "openrouter" ? config.openRouter.model : config.ollama.model;
}

export function selectPrimaryAiProvider(config: AiConfig = getAiConfig()): {
  provider: AiProvider;
  requestedProvider: AiProviderName;
  usedFallback: boolean;
} {
  const requestedProvider = config.primaryProvider;
  const primary = createAiProvider(requestedProvider, config);
  if (primary) {
    return { provider: primary, requestedProvider, usedFallback: false };
  }

  if (requestedProvider === "openrouter") {
    throw new AiConfigurationError(
      "openrouter",
      "AI_PROVIDER=openrouter but OPENROUTER_API_KEY is missing. Set OPENROUTER_API_KEY on the server."
    );
  }

  return {
    provider: createOllamaProvider(config.ollama),
    requestedProvider,
    usedFallback: true,
  };
}
