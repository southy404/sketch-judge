import type { AiGenerateOptions, AiMessage, AiProvider } from "./types";

type OpenRouterProviderConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
  siteUrl: string;
  appName: string;
};

type OpenRouterTextPart = {
  type: "text";
  text: string;
};

type OpenRouterImagePart = {
  type: "image_url";
  image_url: { url: string };
};

type OpenRouterMessage = {
  role: AiMessage["role"];
  content: string | Array<OpenRouterTextPart | OpenRouterImagePart>;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function toDataUrl(image: string): string {
  if (image.startsWith("data:")) return image;
  return `data:image/png;base64,${image}`;
}

function findLastUserMessageIndex(messages: OpenRouterMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (messages[index].role === "user") return index;
  }
  return -1;
}

function extractAssistantContent(data: OpenRouterResponse): string {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part.type === "text" || part.type == null ? part.text || "" : ""))
      .join("");
  }
  return "";
}

function redact(value: string, apiKey: string): string {
  if (!apiKey) return value;
  return value.split(apiKey).join("[redacted]");
}

export function createOpenRouterProvider(config: OpenRouterProviderConfig): AiProvider {
  return {
    name: "openrouter",
    model: config.model,
    async generate(messages: AiMessage[], options: AiGenerateOptions = {}) {
      const openRouterMessages: OpenRouterMessage[] = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      if (options.responseFormat === "json") {
        openRouterMessages.unshift({
          role: "system",
          content: "Respond with valid JSON only. Do not include Markdown fences or explanatory prose.",
        });
      }

      if (options.images?.length) {
        const lastUserIndex = findLastUserMessageIndex(openRouterMessages);
        const imageParts = options.images.map<OpenRouterImagePart>((image) => ({
          type: "image_url",
          image_url: { url: toDataUrl(image) },
        }));
        const targetIndex = lastUserIndex >= 0 ? lastUserIndex : openRouterMessages.length;

        if (targetIndex === openRouterMessages.length) {
          openRouterMessages.push({
            role: "user",
            content: imageParts,
          });
        } else {
          const target = openRouterMessages[targetIndex];
          const text = typeof target.content === "string" ? target.content : "";
          target.content = [{ type: "text", text }, ...imageParts];
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      };
      if (config.siteUrl) headers["HTTP-Referer"] = config.siteUrl;
      if (config.appName) headers["X-Title"] = config.appName;

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: openRouterMessages,
          ...(typeof options.temperature === "number" ? { temperature: options.temperature } : {}),
          ...(typeof options.maxTokens === "number" ? { max_tokens: options.maxTokens } : {}),
          ...(options.responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
        }),
      });

      const raw = await response.text();
      let data: OpenRouterResponse | null = null;
      try {
        data = raw ? (JSON.parse(raw) as OpenRouterResponse) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message = data?.error?.message || raw || response.statusText;
        throw new Error(`OpenRouter failed ${response.status}: ${redact(message, config.apiKey).slice(0, 400)}`);
      }

      const content = data ? extractAssistantContent(data) : "";
      if (!content) {
        throw new Error("OpenRouter returned no assistant content");
      }

      return content;
    },
  };
}
