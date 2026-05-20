<p align="center">
  <img src="./public/sketch-judge-logo.svg" alt="Sketch Judge logo" width="520" />
</p>

<p align="center">
  <img alt="MVP" src="https://img.shields.io/badge/status-MVP-7bd6c9?style=for-the-badge">
  <img alt="Gemma 4" src="https://img.shields.io/badge/Gemma%204-local%20AI-5aa7ff?style=for-the-badge">
  <img alt="Ollama" src="https://img.shields.io/badge/Ollama-runtime-11131a?style=for-the-badge">
  <img alt="React" src="https://img.shields.io/badge/React-UI-61dafb?style=for-the-badge">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict%20code-3178c6?style=for-the-badge">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-dev%20server-646cff?style=for-the-badge">
  <img alt="License Apache 2.0" src="https://img.shields.io/badge/license-Apache--2.0-blue?style=for-the-badge">
</p>

<h1 align="center">Sketch Judge</h1>

<p align="center">
  <strong>Draw fast. Match right. AI decides.</strong>
</p>

<p align="center">
  A mobile-first drawing game prototype where Gemma chooses the motif, players sketch against the clock, and AI judges how well each drawing matches the target.
</p>

<p align="center">
  <img src="./public/mockup.png" alt="Sketch Judge app screens" width="900" />
</p>

---

## What is Sketch Judge?

Sketch Judge is a playful AI drawing game prototype for kids, adults, and artists.

The game loop is simple:

1. Add players.
2. Choose rounds and draw time.
3. Let Gemma choose a motif.
4. Reveal the motif to the current player.
5. Draw before the timer ends.
6. Let the AI judge the drawing.
7. Compare everyone in the final leaderboard.

The goal is not only to draw something beautiful. The goal is to draw something that clearly matches the motif.

---

## Why Gemma 4?

Sketch Judge was built for the **Gemma 4 Challenge**.

Gemma is used as the core game brain:

- choosing fresh drawing motifs,
- creating harder Artist Mode prompts,
- judging sketches against the target motif,
- returning scores, category ratings, and feedback,
- keeping the prototype local-first through Ollama.

The prototype currently runs with **Ollama** and the local model:

```txt
gemma4:e4b
```

This setup was chosen because the same idea can later move toward a fully local mobile experience. A smaller local Gemma model could make the game playable on-device without a cloud AI service.

---

## Modes

### Casual Mode

Casual Mode is forgiving and family-friendly.  
A simple but recognizable drawing can score well.

### Artist Mode

Artist Mode is stricter and aimed at adults, artists, and competitive players.  
It prefers harder motifs and judges detail, proportion, creativity, and effort more seriously.

---

## Features

- Mobile-first responsive game UI
- React + TypeScript + Vite frontend
- Node/Express local API server
- Ollama integration for local Gemma inference
- Gemma-powered motif generation
- AI judging with score, category dots, and feedback
- Casual Mode and stricter Artist Mode
- Round-based multiplayer flow
- Canvas drawing tools:
  - brush
  - eraser
  - fill
  - line
  - circle
  - rectangle
  - color palette
  - brush size
  - undo
  - clear
- Final leaderboard and round summaries
- Recent motif memory to reduce repetition
- Fallback motif and score logic when AI output is unavailable
- Pastel sketchbook visual style

---

## Tech Stack

| Layer           | Tech                   |
| --------------- | ---------------------- |
| Frontend        | React                  |
| Language        | TypeScript             |
| Build Tool      | Vite                   |
| Canvas          | HTML Canvas            |
| API Server      | Node.js + Express      |
| AI Runtime      | Ollama / OpenRouter    |
| Model           | Gemma 4 / `gemma4:e4b` |
| Dev Runner      | tsx                    |
| Package Manager | pnpm                   |

---

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Ollama

Make sure Ollama is running locally:

```bash
ollama serve
```

Run the model used by the prototype:

```bash
ollama run gemma4:e4b
```

If your local model name is different, update the environment variable:

```txt
OLLAMA_MODEL=your-model-name
```

### 3. Start the app

```bash
pnpm dev
```

This starts both:

- Vite frontend
- local Express API server

---

## Available Scripts

```bash
pnpm dev
```

Start frontend and local API together.

```bash
pnpm dev:phone
```

Start the app on `0.0.0.0` so it can be tested from a phone on the same network.

```bash
pnpm dev:web
```

Start only the Vite frontend.

```bash
pnpm dev:api
```

Start only the local API server.

```bash
pnpm build
```

Run TypeScript build checks and create the Vite production build.

```bash
pnpm preview
```

Preview the production build locally.

---

## AI Providers

Sketch Judge calls its own backend with relative URLs like `/api/motif` and `/api/judge`. The browser never calls OpenRouter directly and never receives `OPENROUTER_API_KEY`.

Local Ollama mode:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma4:e4b
```

Vercel/OpenRouter mode:

```bash
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=google/gemma-3-4b-it
```

On local development, the default provider is Ollama. On Vercel, the default provider is OpenRouter. If OpenRouter is selected but `OPENROUTER_API_KEY` is missing, the API returns a clear JSON configuration error instead of exposing a secret or failing with a vague 404/500. If an OpenRouter request fails after configuration is present, Sketch Judge falls back to the existing deterministic motif and judge scoring logic where possible.

---

## Environment Variables

Create a local `.env` from `.env.example`.

```txt
AI_PROVIDER=ollama
AI_FALLBACK_PROVIDER=ollama

OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=gemma4:e4b

OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemma-3-4b-it
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=https://sketch-judge.vercel.app
OPENROUTER_APP_NAME=Sketch Judge

PORT=8789
```

---

## Project Structure

The project is intentionally compact.  
This is the practical structure, reduced to the important parts:

```txt
.
├── public/
│   ├── sketch-judge-logo.svg
│   └── mockup.png
│
├── api/
│   ├── motif.ts              # Vercel POST /api/motif
│   └── judge.ts              # Vercel POST /api/judge
│
├── server/
│   ├── ai/                   # Provider config, OpenRouter, Ollama abstraction
│   ├── apiHandlers.ts        # Shared motif + judge logic
│   ├── index.ts              # Local Express API wrapper
│   ├── motifs.ts             # Casual/artist motif pools and fallback picking
│   ├── motifValidation.ts    # Motif safety, boring/recent checks
│   └── judgeScoring.ts       # Score guards, artist mode caps, self-tests
│
├── src/
│   ├── components/           # Game screens and UI components
│   ├── drawing/              # Canvas drawing engine and tools
│   ├── api.ts                # Frontend API client
│   ├── App.tsx               # Main game state machine
│   ├── gameLogic.ts          # Rounds, players, flow helpers
│   ├── scoring.ts            # Frontend score labels
│   ├── storage.ts            # Local persistence
│   ├── types.ts              # Shared frontend types
│   └── styles.css            # App styling
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── LICENSE
├── NOTICE
└── README.md
```

---

## Deployment Notes

The app includes Vercel API routes at `/api/motif` and `/api/judge`, so a Vercel deployment no longer depends on the local Express server. Vercel should use OpenRouter because serverless functions cannot access your local Ollama instance.

In Vercel Project Settings > Environment Variables, set:

```txt
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=google/gemma-3-4b-it
```

After changing Vercel environment variables, redeploy the project so the serverless functions receive the new values.

---

## Challenge Submission Notes

Sketch Judge was created as a **Build with Gemma 4** submission.

The project focuses on:

- meaningful Gemma usage as the game judge,
- local-first AI through Ollama,
- mobile-first design,
- playful interaction for young and older players,
- a path toward future on-device AI gameplay.

---

## License

The source code is licensed under the **Apache License 2.0**.

```txt
Copyright © 2026 Southy404
```

Branding assets, app icons, mascots, screenshots, mockups, logos, and visual identity elements are not included in the Apache-2.0 license unless explicitly stated otherwise.

---

## Credits

Created by **Southy404**.

Built for the **Gemma 4 Challenge**.
