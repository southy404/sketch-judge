import { getAiConfig } from "./config.js";
import {
  AiConfigurationError,
  createAiProvider,
  selectPrimaryAiProvider,
} from "./provider.js";
import type {
  AiGenerateOptions,
  AiGenerateResult,
  AiMessage,
  AiProvider,
} from "./types.js";

export { getAiConfig } from "./config.js";
export { AiConfigurationError } from "./provider.js";
export type {
  AiGenerateOptions,
  AiGenerateResult,
  AiMessage,
  AiProvider,
  AiProviderName,
} from "./types.js";

export function getPrimaryAiProvider(): AiProvider {
  return selectPrimaryAiProvider().provider;
}

export async function generateWithAi(
  messages: AiMessage[],
  options: AiGenerateOptions = {}
): Promise<AiGenerateResult> {
  const config = getAiConfig();
  const primarySelection = selectPrimaryAiProvider(config);
  const primary = primarySelection.provider;

  try {
    const text = await primary.generate(messages, options);
    return {
      text,
      provider: primary.name,
      model: primary.model,
      usedFallback: primarySelection.usedFallback,
    };
  } catch (error) {
    console.warn(
      `[ai] ${primary.name} failed; checking fallback provider.`,
      error
    );
  }

  // On Vercel, do not try local Ollama fallback.
  // 127.0.0.1 would be the Vercel function, not the user's machine.
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

  if (!isVercel) {
    const fallback = createAiProvider(config.fallbackProvider, config);
    const canTryFallback = fallback && fallback.name !== primary.name;

    if (canTryFallback) {
      try {
        const text = await fallback.generate(messages, options);
        return {
          text,
          provider: fallback.name,
          model: fallback.model,
          usedFallback: true,
        };
      } catch (error) {
        console.warn(
          `[ai] ${fallback.name} fallback failed; using deterministic fallback.`,
          error
        );
      }
    }
  }

  return {
    text: "",
    provider: "fallback",
    model: "deterministic",
    usedFallback: true,
  };
}
