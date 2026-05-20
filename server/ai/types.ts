export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiGenerateOptions = {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
  images?: string[];
};

export type AiProviderName = "ollama" | "openrouter";

export type AiProvider = {
  name: AiProviderName;
  model: string;
  generate(messages: AiMessage[], options?: AiGenerateOptions): Promise<string>;
};

export type AiGenerateResult = {
  text: string;
  provider: AiProviderName | "fallback";
  model: string;
  usedFallback: boolean;
};
