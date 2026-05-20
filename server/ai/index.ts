import { getAiConfig } from "./config";
import { createAiProvider, selectPrimaryAiProvider } from "./provider";
import type { AiGenerateOptions, AiGenerateResult, AiMessage, AiProvider } from "./types";

export { getAiConfig } from "./config";
export type {
  AiGenerateOptions,
  AiGenerateResult,
  AiMessage,
  AiProvider,
  AiProviderName,
} from "./types";

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
    console.warn(`[ai] ${primary.name} failed; checking fallback provider.`, error);
  }

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
      console.warn(`[ai] ${fallback.name} fallback failed; using deterministic fallback.`, error);
    }
  }

  return {
    text: "",
    provider: "fallback",
    model: "deterministic",
    usedFallback: true,
  };
}
