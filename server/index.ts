import express from "express";
import cors from "cors";
import { loadLocalEnv } from "./loadLocalEnv.js";
import { runJudgeGuardSelfTest } from "./judgeScoring.js";
import {
  createHealthResponse,
  createJudgeResponse,
  createMotifResponse,
} from "./apiHandlers.js";
import { getAiConfig } from "./ai/index.js";

loadLocalEnv();

const app = express();
const port = Number(process.env.PORT || 8789);

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/api/health", (_req, res) => {
  res.json(createHealthResponse());
});

app.post("/api/motif", async (req, res) => {
  const result = await createMotifResponse(req.body);
  res.status(result.status).json(result.body);
});

app.post("/api/judge", async (req, res) => {
  const result = await createJudgeResponse(req.body);
  res.status(result.status).json(result.body);
});

const selfTest = runJudgeGuardSelfTest();
if (selfTest.pass) {
  console.log(selfTest.report);
} else {
  console.error(selfTest.report);
}

app.listen(port, "0.0.0.0", () => {
  const aiConfig = getAiConfig();
  console.log(`[sketch-judge-api] http://127.0.0.1:${port}`);
  console.log(
    `[sketch-judge-api] AI provider: ${aiConfig.primaryProvider} | fallback: ${aiConfig.fallbackProvider}`
  );
  console.log(
    `[sketch-judge-api] Ollama: ${aiConfig.ollama.baseUrl} | model: ${aiConfig.ollama.model}`
  );
});
