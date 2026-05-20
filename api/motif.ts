import { createMotifResponse } from "../server/apiHandlers.js";

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST /api/motif.",
    });
  }

  try {
    const result = await createMotifResponse(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[api/motif] unhandled error", error);

    return res.status(500).json({
      ok: false,
      error: "Motif generation failed.",
    });
  }
}
