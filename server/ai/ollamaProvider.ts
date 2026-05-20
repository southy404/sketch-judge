import type { AiGenerateOptions, AiMessage, AiProvider } from "./types.js";

type OllamaProviderConfig = {
  baseUrl: string;
  model: string;
};

type OllamaResponse = {
  message?: { content?: string };
  response?: string;
};

type OllamaMessage = {
  role: AiMessage["role"];
  content: string;
  images?: string[];
};

function imageForOllama(image: string): string {
  return image.replace(/^data:image\/\w+;base64,/, "");
}

function findLastUserMessageIndex(messages: OllamaMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === "user") return index;
  }
  return -1;
}

export function createOllamaProvider(config: OllamaProviderConfig): AiProvider {
  return {
    name: "ollama",
    model: config.model,
    async generate(messages: AiMessage[], options: AiGenerateOptions = {}) {
      const ollamaMessages: OllamaMessage[] = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      if (options.images?.length) {
        const lastUserIndex = findLastUserMessageIndex(ollamaMessages);
        const imagePayload = options.images.map(imageForOllama);
        if (lastUserIndex >= 0) {
          ollamaMessages[lastUserIndex].images = imagePayload;
        } else {
          ollamaMessages.push({
            role: "user",
            content: "",
            images: imagePayload,
          });
        }
      }

      const response = await fetch(`${config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: config.model,
          stream: false,
          messages: ollamaMessages,
          ...(options.responseFormat === "json" ? { format: "json" } : {}),
          options: {
            ...(typeof options.temperature === "number" ? { temperature: options.temperature } : {}),
            ...(typeof options.maxTokens === "number" ? { num_predict: options.maxTokens } : {}),
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Ollama failed ${response.status}: ${body.slice(0, 400)}`);
      }

      const data = (await response.json()) as OllamaResponse;
      return String(data?.message?.content || data?.response || "");
    },
  };
}
