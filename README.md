# PromptMachine

PromptMachine is a Vite + React + TypeScript front-end prototype for interacting with a VEO/GenAI-style model (video / multimodal generation). This repo contains UI components, a lightweight services layer for API calls, and shared TypeScript types.

## Features
- React + TypeScript app scaffolded with Vite
- Components for entering prompts, showing progress, API key input, and displaying video results
- Services layer for API interactions

## Quickstart

1. Clone the repository

```bash
git clone https://github.com/thebearwithabite/PromptMachine.git
cd PromptMachine
```

2. Install dependencies

```bash
npm install
# or pnpm install / yarn install
```

3. Create `.env.local` from `.env.example` and fill in your API key

```bash
cp .env.example .env.local
# edit .env.local and set VITE_GENAI_API_KEY
```

4. Run the dev server

```bash
npm run dev
```

5. Build for production

```bash
npm run build
npm run preview
```

## Environment Variables
The app expects client-side Vite variables (prefixed with `VITE_`). Example variables (see `.env.example`):

- VITE_GENAI_API_KEY: Your GenAI / VEO API key (or a placeholder if using a server-side proxy)
- VITE_GENAI_MODEL: Optional default model (e.g., `veo-3.1`)
- VITE_API_BASE_URL: Optional API base URL when using a proxy or backend
- VITE_ENABLE_LOGGING: Optional flag to enable client-side logging

Note: Be cautious exposing secrets in front-end apps. For production, prefer a server-side proxy to keep API keys secret.

## Project structure

- App.tsx - Main application and wiring
- components/ - UI components (ApiKeyDialog, PromptForm, VideoResult, LoadingIndicator, ActivityLog)
- services/ - API wrappers and client logic
- types.ts - Shared TypeScript types and interfaces
- vite.config.ts - Vite configuration and path aliases

## Contributing
Contributions welcome. Consider opening issues or PRs for features, bug fixes, or documentation improvements.

## License
This project is licensed under the Apache License, Version 2.0. See the LICENSE file for details.
